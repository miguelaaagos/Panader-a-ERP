"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Utensils, Clock, DollarSign, Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { getRecipes, deleteRecipe, getRecipeDetail } from "@/actions/recipes"
import { RecipeFormDialog } from "@/components/recetas/recipe-form-dialog"

interface Recipe {
    id: string
    nombre: string
    descripcion: string | null
    costo_total: number | null
    costo_por_unidad: number | null
    rendimiento: number
    tiempo_preparacion_minutos: number | null
    activa: boolean
    producto: {
        nombre: string
        unidad_medida: string
    }
}

export default function RecetasPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Dialog states
    const [recipeFormOpen, setRecipeFormOpen] = useState(false)
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
    const [fetchingDetail, setFetchingDetail] = useState(false)

    const fetchRecipes = async () => {
        setLoading(true)
        const result = await getRecipes()
        if (result.success && result.data) {
            const sanitizedRecetas: Recipe[] = result.data.map(r => ({
                id: r.id,
                nombre: r.nombre,
                descripcion: r.descripcion,
                costo_total: r.costo_total ?? 0,
                costo_por_unidad: r.costo_por_unidad ?? 0,
                rendimiento: r.rendimiento ?? 1,
                tiempo_preparacion_minutos: r.tiempo_preparacion_minutos,
                activa: r.activa ?? true,
                producto: {
                    nombre: r.producto?.nombre || "N/A",
                    unidad_medida: r.producto?.unidad_medida || ""
                }
            }))
            setRecipes(sanitizedRecetas)
            setFilteredRecipes(sanitizedRecetas)
        } else if (!result.success) {
            toast.error("Error al cargar recetas: " + result.error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRecipes()
    }, [])

    useEffect(() => {
        const filtered = recipes.filter(r =>
            r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredRecipes(filtered)
    }, [searchTerm, recipes])

    const handleEdit = async (id: string) => {
        setFetchingDetail(true)
        const result = await getRecipeDetail(id)
        if (result.success) {
            setSelectedRecipe(result.data)
            setRecipeFormOpen(true)
        } else {
            toast.error("Error al obtener detalle: " + result.error)
        }
        setFetchingDetail(false)
    }

    const handleDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Estás seguro de desactivar la receta: ${nombre}?`)) return

        const result = await deleteRecipe(id)
        if (result.success) {
            toast.success("Receta desactivada")
            fetchRecipes()
        } else {
            toast.error("Error: " + result.error)
        }
    }

    return (
        <RoleGuard
            permission="recipes.view"
            fallback={
                <div className="flex-1 flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground text-lg">No tienes permisos para acceder a esta sección.</p>
                </div>
            }
        >
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Recetas y Costeo 🧁</h2>
                    <div className="flex items-center space-x-2">
                        <RoleGuard permission="recipes.manage">
                            <Button
                                onClick={() => {
                                    setSelectedRecipe(null)
                                    setRecipeFormOpen(true)
                                }}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Nueva Receta
                            </Button>
                        </RoleGuard>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Recetas</CardTitle>
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{recipes.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${(recipes.reduce((acc, r) => acc + Number(r.costo_por_unidad), 0) / (recipes.length || 1)).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-card rounded-lg border shadow-sm">
                    <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar receta o producto..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receta</TableHead>
                                    <TableHead>Producto Destino</TableHead>
                                    <TableHead>Rendimiento</TableHead>
                                    <TableHead>Costo Unitario</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">Cargando recetas...</TableCell>
                                    </TableRow>
                                ) : filteredRecipes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No se encontraron recetas</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecipes.map((recipe) => (
                                        <TableRow key={recipe.id}>
                                            <TableCell className="font-medium">{recipe.nombre}</TableCell>
                                            <TableCell>{recipe.producto?.nombre}</TableCell>
                                            <TableCell>{recipe.rendimiento} {recipe.producto?.unidad_medida}</TableCell>
                                            <TableCell className="font-semibold text-primary">
                                                ${Number(recipe.costo_por_unidad).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={recipe.activa ? "outline" : "destructive"}>
                                                    {recipe.activa ? "Activa" : "Inactiva"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(recipe.id)}
                                                        disabled={fetchingDetail}
                                                    >
                                                        {fetchingDetail && selectedRecipe?.id === recipe.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Pencil className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <RoleGuard permission="recipes.manage">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive/90"
                                                            onClick={() => handleDelete(recipe.id, recipe.nombre)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </RoleGuard>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <RecipeFormDialog
                    open={recipeFormOpen}
                    onOpenChange={setRecipeFormOpen}
                    recipe={selectedRecipe}
                    onSuccess={fetchRecipes}
                />
            </div>
        </RoleGuard>
    )
}
