"use client"

import { useState, useEffect, useCallback } from "react"
import { getProveedores, type Proveedor } from "@/actions/proveedores"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { RoleGuard } from "@/components/auth/RoleGuard"
import Link from "next/link"
import { ProveedorFormDialog } from "@/components/inventario/proveedor-form-dialog"
import { DeleteProveedorDialog } from "@/components/inventario/delete-proveedor-dialog"

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([])
    const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Dialog states
    const [formOpen, setFormOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

    const fetchProveedores = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getProveedores()
            if (result.success && result.data) {
                setProveedores(result.data)
                setFilteredProveedores(result.data)
            } else if (!result.success) {
                toast.error("Error al cargar proveedores", { description: result.error })
            }
        } catch {
            toast.error("Error al cargar la lista")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProveedores()
    }, [fetchProveedores])

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProveedores(proveedores)
            return
        }

        const term = searchTerm.toLowerCase()
        const filtered = proveedores.filter(p =>
            p.nombre.toLowerCase().includes(term) ||
            p.rut?.toLowerCase().includes(term) ||
            p.email?.toLowerCase().includes(term)
        )
        setFilteredProveedores(filtered)
    }, [searchTerm, proveedores])

    return (
        <RoleGuard
            permission="inventory.view"
            fallback={
                <div className="flex-1 flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground text-lg">No tienes permisos para acceder a Proveedores.</p>
                </div>
            }
        >
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/inventario">
                                <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <h2 className="text-3xl font-bold tracking-tight">Proveedores</h2>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">Gestiona la información de tus proveedores de mercadería.</p>
                    </div>

                    <RoleGuard permission="inventory.create">
                        <Button
                            className="gap-2"
                            onClick={() => {
                                setSelectedProveedor(null)
                                setFormOpen(true)
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Proveedor
                        </Button>
                    </RoleGuard>
                </div>

                <Card>
                    <CardHeader className="pb-3 border-b border-border/40">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Directorio</CardTitle>
                            <div className="relative w-64 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre, RUT, email..."
                                    className="pl-8 bg-muted/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Nombre</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead className="hidden md:table-cell">RUT</TableHead>
                                    <TableHead className="hidden lg:table-cell">Dirección</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            Cargando información...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProveedores.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            {searchTerm ? "No se encontraron resultados" : "No hay proveedores registrados"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProveedores.map((proveedor) => (
                                        <TableRow key={proveedor.id} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">
                                                {proveedor.nombre}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5 text-sm">
                                                    {proveedor.telefono && <span>📞 {proveedor.telefono}</span>}
                                                    {proveedor.email && <span>📧 {proveedor.email}</span>}
                                                    {!proveedor.telefono && !proveedor.email && (
                                                        <span className="text-muted-foreground italic">Sin datos</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {proveedor.rut || "-"}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell max-w-[200px] truncate" title={proveedor.direccion || ""}>
                                                {proveedor.direccion || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <RoleGuard permission="inventory.edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                setSelectedProveedor(proveedor)
                                                                setFormOpen(true)
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </RoleGuard>
                                                    <RoleGuard permission="inventory.delete">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => {
                                                                setSelectedProveedor(proveedor)
                                                                setDeleteOpen(true)
                                                            }}
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
                    </CardContent>
                </Card>
            </div>

            <ProveedorFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                proveedorSelected={selectedProveedor}
                onSuccess={fetchProveedores}
            />

            <DeleteProveedorDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                proveedor={selectedProveedor}
                onSuccess={fetchProveedores}
            />
        </RoleGuard>
    )
}
