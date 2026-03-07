"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { eliminarGasto, generarGastosFijosDelMes } from "@/actions/gastos"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Wallet, RefreshCw, FilterX, FileEdit } from "lucide-react"
import { GastoEditarDialog } from "@/components/gastos/gasto-editar-dialog"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

interface GastoRow {
    id: string
    fecha_gasto: string
    estado: string
    descripcion: string
    categoria_id: string | null
    categoria?: {
        id: string
        nombre: string
    } | undefined
    tipo_gasto: "fijo" | "variable"
    tipo_documento: "Factura" | "Boleta" | "Recibo" | "Otro"
    monto_neto: number
    monto_iva: number
    monto_total: number
}

interface GastosClientProps {
    initialGastos: GastoRow[]
    mes: number
    anio: number
}

export function GastosClient({ initialGastos, mes, anio }: GastosClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [generating, setGenerating] = useState(false)

    const [selectedGasto, setSelectedGasto] = useState<GastoRow | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const handleEditClick = (gasto: GastoRow) => {
        setSelectedGasto(gasto)
        setIsEditDialogOpen(true)
    }

    const updateFilters = (newMes: string, newAnio: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("mes", newMes)
        params.set("anio", newAnio)

        startTransition(() => {
            router.push(`/dashboard/gastos?${params.toString()}`)
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este gasto de manera manual?")) return
        const res = await eliminarGasto(id)
        if (res.success) {
            toast.success("Gasto eliminado correctamente")
            router.refresh()
        } else {
            toast.error(res.error)
        }
    }

    const handleGenerarRecurrentes = async () => {
        if (!confirm("Esto copiará los Costos Fijos del mes pasado (ej. Arriendo, Sueldos) a la fecha de hoy. ¿Deseas continuar?")) return

        setGenerating(true)
        const res = await generarGastosFijosDelMes()
        if (res.success) {
            toast.success(res.message)
            if (res.count && res.count > 0) {
                router.refresh()
            }
        } else {
            toast.error("Error al generar recurrentes: " + res.error)
        }
        setGenerating(false)
    }

    const currentYear = new Date().getFullYear();
    const añosHaciaAtras = 5;
    const aniosDisponibles = Array.from({ length: añosHaciaAtras }, (_, i) => currentYear - i);

    const today = new Date()

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gastos Operativos <Wallet className="inline-block w-8 h-8 ml-2 text-primary" /></h2>
                    <p className="text-muted-foreground">Administra los gastos y egresos del negocio.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button variant="outline" onClick={handleGenerarRecurrentes} disabled={generating || isPending}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? "Generando..." : "Cargar Fijos"}
                    </Button>
                    <Link href="/dashboard/gastos/nuevo">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center space-x-2 mb-4 bg-muted/30 p-2 rounded-lg border w-fit">
                <Select value={mes.toString()} onValueChange={(v) => updateFilters(v, anio.toString())}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                        {MESES.map((m, i) => (
                            <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={anio.toString()} onValueChange={(v) => updateFilters(mes.toString(), v)}>
                    <SelectTrigger className="w-[100px] bg-background">
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {aniosDisponibles.map(a => (
                            <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        updateFilters(today.getMonth().toString(), today.getFullYear().toString())
                    }}
                    title="Ver mes actual"
                >
                    <FilterX className="h-4 w-4" />
                </Button>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto relative">
                {isPending && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead className="text-right">Neto</TableHead>
                            <TableHead className="text-right">IVA</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialGastos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">No hay gastos registrados en este periodo.</TableCell>
                            </TableRow>
                        ) : (
                            initialGastos.map((gasto) => (
                                <TableRow key={gasto.id} className={gasto.estado === 'anulada' ? 'opacity-60 bg-muted/30' : ''}>
                                    <TableCell className="font-medium">
                                        {format(new Date(gasto.fecha_gasto), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={gasto.estado === 'anulada' ? 'destructive' : 'outline'} className={gasto.estado === 'anulada' ? '' : 'border-emerald-500 text-emerald-600'}>
                                            {gasto.estado === 'anulada' ? 'Anulado' : 'Completado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={gasto.estado === 'anulada' ? 'line-through' : ''}>
                                        {gasto.descripcion}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{gasto.categoria?.nombre || "Sin Categoría"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={gasto.tipo_gasto === "fijo" ? "default" : "secondary"} className={gasto.tipo_gasto === "fijo" ? 'bg-indigo-500 hover:bg-indigo-600' : ''}>
                                            {gasto.tipo_gasto === "fijo" ? "Fijo" : "Variable"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={gasto.tipo_documento === "Factura" ? "default" : "secondary"}>
                                            {gasto.tipo_documento}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">${gasto.monto_neto.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${gasto.monto_iva.toLocaleString()}</TableCell>
                                    <TableCell className={`text-right ${gasto.estado === 'anulada' ? 'line-through' : 'font-bold'}`}>${gasto.monto_total.toLocaleString()}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-1">
                                        {gasto.estado !== 'anulada' && (
                                            <Button variant="ghost" size="icon" className="text-blue-600 h-8 w-8 hover:bg-blue-600/20" onClick={() => handleEditClick(gasto)}>
                                                <FileEdit className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/20" onClick={() => handleDelete(gasto.id)} disabled={gasto.estado === 'anulada'}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <GastoEditarDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                gasto={selectedGasto}
                onEdited={() => router.refresh()}
            />
        </div>
    )
}
