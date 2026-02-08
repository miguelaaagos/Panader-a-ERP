"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, FolderOpen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Categoria {
    id: string
    nombre: string
    _count?: {
        productos: number
    }
}

interface CategoryManagerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CategoryManagerDialog({ open, onOpenChange, onSuccess }: CategoryManagerDialogProps) {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [editCategoryName, setEditCategoryName] = useState("")

    useEffect(() => {
        if (open) {
            fetchCategorias()
        }
    }, [open])

    const fetchCategorias = async () => {
        setLoading(true)
        try {
            const supabase = createClient()

            // Obtener categorías
            const { data: categoriasData, error: categoriasError } = await supabase
                .from("categorias")
                .select("id, nombre")
                .order("nombre")

            if (categoriasError) throw categoriasError

            // Contar productos por categoría
            const categoriasWithCount = await Promise.all(
                (categoriasData || []).map(async (cat) => {
                    const { count } = await supabase
                        .from("productos")
                        .select("*", { count: "exact", head: true })
                        .eq("categoria_id", cat.id)

                    return {
                        ...cat,
                        _count: { productos: count || 0 }
                    }
                })
            )

            setCategorias(categoriasWithCount)
        } catch (error: any) {
            console.error("Error fetching categorias:", error)
            toast.error("Error al cargar categorías")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newCategoryName.trim()) {
            toast.error("El nombre de la categoría es requerido")
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("categorias")
                .insert([{ nombre: newCategoryName.trim() }])

            if (error) throw error

            toast.success("Categoría creada correctamente")
            setNewCategoryName("")
            fetchCategorias()
            onSuccess()
        } catch (error: any) {
            console.error("Error creating category:", error)
            toast.error("Error al crear categoría", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id: string) => {
        if (!editCategoryName.trim()) {
            toast.error("El nombre de la categoría es requerido")
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("categorias")
                .update({ nombre: editCategoryName.trim() })
                .eq("id", id)

            if (error) throw error

            toast.success("Categoría actualizada correctamente")
            setEditingId(null)
            setEditCategoryName("")
            fetchCategorias()
            onSuccess()
        } catch (error: any) {
            console.error("Error updating category:", error)
            toast.error("Error al actualizar categoría", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (categoria: Categoria) => {
        if ((categoria._count?.productos || 0) > 0) {
            toast.error("No se puede eliminar", {
                description: "Esta categoría tiene productos asociados"
            })
            return
        }

        if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("categorias")
                .delete()
                .eq("id", categoria.id)

            if (error) throw error

            toast.success("Categoría eliminada correctamente")
            fetchCategorias()
            onSuccess()
        } catch (error: any) {
            console.error("Error deleting category:", error)
            toast.error("Error al eliminar categoría", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" />
                        Gestionar Categorías
                    </DialogTitle>
                    <DialogDescription>
                        Crea, edita o elimina categorías de productos
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Crear Nueva Categoría */}
                    <div className="space-y-2">
                        <Label htmlFor="new-category">Nueva Categoría</Label>
                        <div className="flex gap-2">
                            <Input
                                id="new-category"
                                placeholder="Nombre de la categoría"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleCreate()
                                    }
                                }}
                                disabled={loading}
                            />
                            <Button onClick={handleCreate} disabled={loading || !newCategoryName.trim()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Crear
                            </Button>
                        </div>
                    </div>

                    {/* Lista de Categorías */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-center">Productos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && categorias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : categorias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            No hay categorías creadas
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categorias.map((categoria) => (
                                        <TableRow key={categoria.id}>
                                            <TableCell>
                                                {editingId === categoria.id ? (
                                                    <Input
                                                        value={editCategoryName}
                                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleUpdate(categoria.id)
                                                            }
                                                            if (e.key === "Escape") {
                                                                setEditingId(null)
                                                                setEditCategoryName("")
                                                            }
                                                        }}
                                                        autoFocus
                                                        disabled={loading}
                                                    />
                                                ) : (
                                                    <span className="font-medium">{categoria.nombre}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-muted-foreground">
                                                    {categoria._count?.productos || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingId === categoria.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdate(categoria.id)}
                                                            disabled={loading}
                                                        >
                                                            Guardar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingId(null)
                                                                setEditCategoryName("")
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingId(categoria.id)
                                                                setEditCategoryName(categoria.nombre)
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(categoria)}
                                                            disabled={loading || (categoria._count?.productos || 0) > 0}
                                                            title={
                                                                (categoria._count?.productos || 0) > 0
                                                                    ? "No se puede eliminar: tiene productos asociados"
                                                                    : "Eliminar categoría"
                                                            }
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Alert>
                        <AlertDescription className="text-sm">
                            💡 <strong>Tip:</strong> No puedes eliminar categorías que tengan productos asociados.
                            Primero debes reasignar o eliminar esos productos.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
