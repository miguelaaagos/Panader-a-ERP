"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema para ingredientes dentro de una receta
const recipeIngredientSchema = z.object({
    ingrediente_id: z.string().uuid("ID de ingrediente inválido"),
    cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
    notas: z.string().optional().nullable(),
    orden: z.number().int().default(0),
})

// Schema para la receta completa
const recipeSchema = z.object({
    producto_id: z.string().uuid("Producto destino inválido"),
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional().nullable(),
    instrucciones: z.string().optional().nullable(),
    rendimiento: z.number().positive("El rendimiento debe ser mayor a 0"),
    tiempo_preparacion_minutos: z.number().min(0).optional().nullable(),
    activa: z.boolean().default(true),
    ingredientes: z.array(recipeIngredientSchema).min(1, "La receta debe tener al menos un ingrediente"),
    margen_deseado: z.number().min(0).max(100).optional().nullable(),
    actualizar_precio_venta: z.boolean().default(false).optional(),
})

export type RecipeFormData = z.infer<typeof recipeSchema>

/**
 * Crea o actualiza una receta completa con sus ingredientes
 */
export async function upsertRecipe(data: RecipeFormData, recipeId?: string) {
    try {
        const { supabase, profile } = await validateRequest('recipes.manage')
        const tenant_id = profile.tenant_id

        const validated = recipeSchema.parse(data)

        // 1. Iniciar la operación de la receta (Upsert)
        const recipeData = {
            tenant_id,
            producto_id: validated.producto_id,
            nombre: validated.nombre,
            descripcion: validated.descripcion,
            instrucciones: validated.instrucciones,
            rendimiento: validated.rendimiento,
            tiempo_preparacion_minutos: validated.tiempo_preparacion_minutos,
            activa: validated.activa,
            updated_at: new Date().toISOString(),
        }

        let currentRecipeId = recipeId

        if (currentRecipeId) {
            const { error: updateError } = await supabase
                .from("recetas")
                .update(recipeData)
                .eq("id", currentRecipeId)
            if (updateError) throw updateError
        } else {
            const { data: newRecipe, error: insertError } = await supabase
                .from("recetas")
                .insert([{ ...recipeData, created_at: new Date().toISOString() }])
                .select()
                .single()
            if (insertError) throw insertError
            currentRecipeId = newRecipe.id
        }

        // 2. Gestionar ingredientes: Borrar anteriores e insertar nuevos
        const { error: deleteError } = await supabase
            .from("receta_ingredientes")
            .delete()
            .eq("receta_id", currentRecipeId)

        if (deleteError) throw deleteError

        // 3. Obtener costos actuales de los ingredientes para calcular costos de línea
        const ingredienteIds = validated.ingredientes.map(i => i.ingrediente_id)
        const { data: ingredientsPrices, error: pricesError } = await supabase
            .from("productos")
            .select("id, costo_unitario")
            .in("id", ingredienteIds)

        if (pricesError) throw pricesError

        type ProductCost = { id: string; costo_unitario: number }
        const priceMap = new Map((ingredientsPrices as ProductCost[])?.map((p: ProductCost) => [p.id, Number(p.costo_unitario)]))

        let costoTotalReceta = 0
        const ingredientesToInsert = validated.ingredientes.map(ing => {
            const costoUnitario = priceMap.get(ing.ingrediente_id) || 0
            const costoLinea = ing.cantidad * costoUnitario
            costoTotalReceta += costoLinea

            return {
                tenant_id,
                receta_id: currentRecipeId,
                ingrediente_id: ing.ingrediente_id,
                cantidad: ing.cantidad,
                costo_linea: costoLinea,
                orden: ing.orden,
                created_at: new Date().toISOString(),
            }
        })

        const { error: ingredientesError } = await supabase
            .from("receta_ingredientes")
            .insert(ingredientesToInsert)

        if (ingredientesError) throw ingredientesError

        // 4. Actualizar costos finales en la receta
        const costoPorUnidad = costoTotalReceta / validated.rendimiento
        const { error: finalRecipeUpdateError } = await supabase
            .from("recetas")
            .update({
                costo_total: costoTotalReceta,
                costo_por_unidad: costoPorUnidad
            })
            .eq("id", currentRecipeId)

        if (finalRecipeUpdateError) throw finalRecipeUpdateError

        // 5. Propagar costo y margen al producto terminado
        const margen = validated.margen_deseado !== undefined && validated.margen_deseado !== null
            ? Number(validated.margen_deseado)
            : 0

        // El precio sugerido se calcula basado en el margen sobre el costo
        // Formula: costo / (1 - margen/100)
        const precioSugerido = margen < 100 ? Math.round(costoPorUnidad / (1 - margen / 100)) : Math.round(costoPorUnidad * 2)

        const productUpdate: any = {
            tiene_receta: true,
            costo_receta: costoPorUnidad,
            precio_sugerido: precioSugerido,
            costo_unitario: costoPorUnidad,
            margen_deseado: margen,
            updated_at: new Date().toISOString()
        }

        // Si el usuario marcó actualizar_precio_venta, lo aplicamos
        if (validated.actualizar_precio_venta) {
            productUpdate.precio_venta = precioSugerido
        }

        await supabase
            .from("productos")
            .update(productUpdate)
            .eq("id", validated.producto_id)

        revalidatePath("/dashboard/recetas")
        revalidatePath("/dashboard/inventario")
        return { success: true, id: currentRecipeId }

    } catch (error: any) {
        console.error("Error in upsertRecipe:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Recalcula los costos de todas las recetas que utilizan un ingrediente específico.
 * Se debe llamar cuando cambia el precio_costo de un producto.
 */
export async function recalculateRecipesUsingIngredient(ingredienteId: string) {
    try {
        const { supabase, profile } = await validateRequest('recipes.manage')

        // 1. Buscar todas las recetas que usan este ingrediente
        const { data: recipeIngs, error: fetchError } = await supabase
            .from("receta_ingredientes")
            .select("receta_id")
            .eq("ingrediente_id", ingredienteId)
            .eq("tenant_id", profile.tenant_id)

        if (fetchError) throw fetchError
        if (!recipeIngs || recipeIngs.length === 0) return { success: true, count: 0 }

        const uniqueRecipeIds = Array.from(new Set(recipeIngs.map((ri: { receta_id: string }) => ri.receta_id)))

        // 2. Por cada receta, forzar un "re-save" o recalcular individualmente
        // Para simplicidad y consistencia, recalculamos cada receta afectada
        for (const recipeId of uniqueRecipeIds) {
            await recalculateRecipeDetail(recipeId as string, supabase)
        }

        revalidatePath("/dashboard/recetas")
        return { success: true, count: uniqueRecipeIds.length }
    } catch (error: any) {
        console.error("Error recalculating recipes:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Función interna para recalcular el costo de una receta y actualizar el producto destino
 */
async function recalculateRecipeDetail(recipeId: string, supabase: any) {
    // 1. Obtener todos los ingredientes actuales y sus precios actuales
    const { data: recipe, error: recipeError } = await supabase
        .from("recetas")
        .select(`
            *,
            receta_ingredientes (
                cantidad,
                ingrediente_id,
                ingrediente:productos!ingrediente_id(costo_unitario)
            )
        `)
        .eq("id", recipeId)
        .single()

    if (recipeError || !recipe) return

    let nuevoCostoTotal = 0
    const batchUpdates = []

    for (const item of recipe.receta_ingredientes) {
        const costoUnitario = Number(item.ingrediente.costo_unitario)
        const nuevoCostoLinea = item.cantidad * costoUnitario
        nuevoCostoTotal += nuevoCostoLinea

        batchUpdates.push(
            supabase
                .from("receta_ingredientes")
                .update({ costo_linea: nuevoCostoLinea })
                .eq("receta_id", recipeId)
                .eq("ingrediente_id", item.ingrediente_id)
        )
    }

    // Actualizar costos de línea en paralelo
    await Promise.all(batchUpdates)

    const costoPorUnidad = nuevoCostoTotal / Number(recipe.rendimiento)

    // 2. Actualizar receta
    await supabase
        .from("recetas")
        .update({
            costo_total: nuevoCostoTotal,
            costo_por_unidad: costoPorUnidad
        })
        .eq("id", recipeId)

    // 3. Actualizar producto destino
    const { data: productData } = await supabase
        .from("productos")
        .select("margen_deseado")
        .eq("id", recipe.producto_id)
        .single()

    const margen = Number(productData?.margen_deseado || 0)
    const precioSugerido = margen < 100 ? Math.round(costoPorUnidad / (1 - margen / 100)) : Math.round(costoPorUnidad * 2)

    await supabase
        .from("productos")
        .update({
            costo_receta: costoPorUnidad,
            precio_sugerido: precioSugerido,
            costo_unitario: costoPorUnidad,
            updated_at: new Date().toISOString()
        })
        .eq("id", recipe.producto_id)
}

/**
 * Obtiene todas las recetas filtradas por tenant
 */
export async function getRecipes() {
    try {
        const { supabase, profile } = await validateRequest('recipes.view')

        const { data, error } = await supabase
            .from("recetas")
            .select(`
                *,
                producto:productos!producto_id(nombre, unidad_medida)
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("nombre")

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Obtiene el detalle de una receta específica
 */
export async function getRecipeDetail(id: string) {
    try {
        const { supabase } = await validateRequest('recipes.view')

        const { data, error } = await supabase
            .from("recetas")
            .select(`
                *,
                ingredientes:receta_ingredientes(
                    *,
                    producto:productos!ingrediente_id(nombre, unidad_medida, costo_unitario)
                )
            `)
            .eq("id", id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Elimina (desactiva) una receta
 */
export async function deleteRecipe(id: string) {
    try {
        const { supabase } = await validateRequest('recipes.manage')

        const { error } = await supabase
            .from("recetas")
            .update({ activa: false })
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/recetas")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
