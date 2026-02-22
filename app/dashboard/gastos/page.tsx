"use client"

import { useState, useEffect } from "react"
import { getGastos, eliminarGasto } from "@/actions/gastos"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Wallet } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function GastosPage() {
    const [gastos, setGastos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchGastos = async () => {
        setLoading(true)
        const res = await getGastos()
        if (res.success && res.data) {
            setGastos(res.data)
        } else {
            toast.error("Error al cargar los gastos: " + res.error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchGastos()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este gasto de manera manual?")) return
        const res = await eliminarGasto(id)
        if (res.success) {
            toast.success("Gasto eliminado correctamente")
            fetchGastos()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gastos Operativos <Wallet className="inline-block w-8 h-8 ml-2 text-primary" /></h2>
                    <p className="text-muted-foreground">Administra los gastos y egresos del negocio.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/gastos/nuevo">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Gasto
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead className="text-right">Neto</TableHead>
                            <TableHead className="text-right">IVA</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">Cargando...</TableCell>
                            </TableRow>
                        ) : gastos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No hay gastos registrados en este periodo.</TableCell>
                            </TableRow>
                        ) : (
                            gastos.map((gasto) => (
                                <TableRow key={gasto.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(gasto.fecha_gasto), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>{gasto.descripcion}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{gasto.categoria?.nombre || "Sin Categoría"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={gasto.tipo_documento === "Factura" ? "default" : "secondary"}>
                                            {gasto.tipo_documento}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">${gasto.monto_neto.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${gasto.monto_iva.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold">${gasto.monto_total.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/20" onClick={() => handleDelete(gasto.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
