"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { recalculateRecipesUsingIngredient } from "./recipes"

// Schema para validación de productos
const productSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    codigo: z.string().optional().nullable(),
    categoria_id: z.string().uuid().optional().nullable(),
    costo_unitario: z.number().min(0, "El costo debe ser mayor o igual a 0"),
    precio_venta: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    stock_actual: z.number().min(0, "El stock debe ser mayor o igual a 0").default(0),
    stock_minimo: z.number().min(0, "El stock mínimo debe ser mayor o igual a 0").default(0),
    activo: z.boolean().default(true),
    tipo: z.enum(["ingrediente", "producto_terminado", "ambos"]).default("producto_terminado"),
    unidad_medida: z.enum(["kg", "g", "L", "ml", "unidades"]).default("unidades"),
    margen_deseado: z.number().min(0, "El margen debe ser positivo").max(100, "El margen no puede exceder 100%").optional().nullable(),
})

export type ProductFormData = z.infer<typeof productSchema>

export async function createProduct(data: ProductFormData) {
    try {
        const { supabase, profile } = await validateRequest('inventory.create')

        const validatedData = productSchema.parse(data)

        const { error } = await supabase
            .from("productos")
            .insert([{
                ...validatedData,
                tenant_id: profile.tenant_id
            }])

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error creating product:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function updateProduct(id: string, data: ProductFormData) {
    try {
        const { supabase } = await validateRequest('inventory.edit')

        const validatedData = productSchema.parse(data)

        // Obtener datos actuales para comparar costo_unitario
        const { data: currentProduct } = await supabase
            .from("productos")
            .select("costo_unitario")
            .eq("id", id)
            .single()

        const { error } = await supabase
            .from("productos")
            .update(validatedData)
            .eq("id", id)

        if (error) throw error

        // Si el precio de costo cambió, recalcular recetas que usan este producto como ingrediente
        if (currentProduct && Number(currentProduct.costo_unitario) !== Number(validatedData.costo_unitario)) {
            await recalculateRecipesUsingIngredient(id)
        }

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error updating product:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function deleteProduct(id: string) {
    try {
        const { supabase } = await validateRequest('inventory.delete')

        // Soft delete (marcar como inactivo)
        const { error } = await supabase
            .from("productos")
            .update({ activo: false })
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error soft deleting product:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function hardDeleteProduct(id: string) {
    try {
        const { supabase } = await validateRequest('inventory.delete')

        // Verificar si hay ventas
        const { count, error: countError } = await supabase
            .from("detalle_ventas")
            .select("*", { count: "exact", head: true })
            .eq("producto_id", id)

        if (countError) throw countError
        if (count && count > 0) {
            throw new Error("No se puede eliminar permanentemente un producto que ya tiene ventas asociadas. Usa la desactivación.")
        }

        const { error } = await supabase
            .from("productos")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error hard deleting product:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function adjustStock(id: string, delta: number) {
    try {
        // adjust_stock permite a admins ajustar manualmente
        const { supabase } = await validateRequest('inventory.adjust_stock')

        // Obtener stock actual
        const { data: product, error: fetchError } = await supabase
            .from("productos")
            .select("stock_actual")
            .eq("id", id)
            .single()

        if (fetchError) throw fetchError

        const newStock = Math.max(0, Number(product.stock_actual) + delta)

        const { error } = await supabase
            .from("productos")
            .update({ stock_actual: newStock })
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true, newStock }
    } catch (error: unknown) {
        console.error("Error adjusting stock:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function createCategory(nombre: string) {
    try {
        const { supabase, profile } = await validateRequest('inventory.create')

        const { error } = await supabase
            .from("categorias")
            .insert([{
                nombre,
                tenant_id: profile.tenant_id
            }])

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error creating category:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function updateCategory(id: string, nombre: string) {
    try {
        const { supabase } = await validateRequest('inventory.edit')

        const { error } = await supabase
            .from("categorias")
            .update({ nombre })
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error updating category:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function deleteCategory(id: string) {
    try {
        const { supabase } = await validateRequest('inventory.delete')

        // Verificar si hay productos usando esta categoría
        const { count, error: countError } = await supabase
            .from("productos")
            .select("*", { count: "exact", head: true })
            .eq("categoria_id", id)

        if (countError) throw countError
        if (count && count > 0) {
            throw new Error("No se puede eliminar una categoría que tiene productos asociados")
        }

        const { error } = await supabase
            .from("categorias")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/inventario")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error deleting category:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getCategories() {
    try {
        // Permitimos ver categorías a roles con inventory.view (admin, cajero, panadero)
        const { supabase, profile } = await validateRequest('inventory.view')
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .order("nombre", { ascending: true })

        if (error) throw error
        return { success: true, data }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

