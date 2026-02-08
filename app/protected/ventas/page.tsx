"use client"

import React, { useState, useEffect, type ChangeEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileDown, Search, Calendar as CalendarIcon, Filter, Eye, X, Ban, Loader2, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Venta {
    id: string
    created_at: string
    total: number
    metodo_pago: string
    tipo_documento: string
    cliente_rut?: string
    cliente_razon_social?: string
    anulada: boolean
    perfil_id: string
    perfiles?: {
        nombre_completo: string
    }
}

interface DetalleVenta {
    id: string
    venta_id: string
    producto_id: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    productos?: {
        nombre: string
        codigo_barras: string
        es_pesable: boolean
    }
}

export default function VentasPage() {
    const supabase = createClient()
    const [ventas, setVentas] = useState<Venta[]>([])
    const [filteredVentas, setFilteredVentas] = useState<Venta[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
    const [detalleVenta, setDetalleVenta] = useState<DetalleVenta[]>([])
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [isAnularModalOpen, setIsAnularModalOpen] = useState(false)
    const [ventaToAnular, setVentaToAnular] = useState<Venta | null>(null)
    const [isAnulando, setIsAnulando] = useState(false)

    console.log("Rendering VentasPage", { loading, ventasLength: ventas.length, filteredLength: filteredVentas.length })


    // Filtros
    const [searchTerm, setSearchTerm] = useState("")
    const [dateFrom, setDateFrom] = useState<Date>()
    const [dateTo, setDateTo] = useState<Date>()
    const [filterMetodoPago, setFilterMetodoPago] = useState<string>("all")
    const [filterTipoDoc, setFilterTipoDoc] = useState<string>("all")
    const [filterAnulada, setFilterAnulada] = useState<string>("all")
    const [filterCajero, setFilterCajero] = useState<string>("all")
    const [cajeros, setCajeros] = useState<{ id: string, nombre_completo: string }[]>([])

    // Paginación
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20





    const fetchVentas = async () => {
        console.log("Fetching ventas...")
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("ventas")
                .select(`
                    *,
                    perfiles (
                        nombre_completo
                    )
                `)
                .order("created_at", { ascending: false })

            if (error) throw error
            setVentas(data || [])
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido"
            toast.error("Error al cargar ventas", {
                description: message
            })
        } finally {
            setLoading(false)
        }
    }


    const fetchCajeros = async () => {
        const { data } = await supabase
            .from("perfiles")
            .select("id, nombre_completo")
            .order("nombre_completo")

        if (data) setCajeros(data)
    }

    const applyFilters = () => {
        console.log("Applying filters", { ventasLength: ventas.length })
        let filtered = [...ventas]

        // Búsqueda por RUT o ID
        if (searchTerm) {
            filtered = filtered.filter(v =>
                v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.cliente_rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.cliente_razon_social?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro de fecha desde
        if (dateFrom) {
            filtered = filtered.filter(v =>
                new Date(v.created_at) >= dateFrom
            )
        }

        // Filtro de fecha hasta
        if (dateTo) {
            const endOfDay = new Date(dateTo)
            endOfDay.setHours(23, 59, 59, 999)
            filtered = filtered.filter(v =>
                new Date(v.created_at) <= endOfDay
            )
        }

        // Filtro método de pago
        if (filterMetodoPago !== "all") {
            filtered = filtered.filter(v => v.metodo_pago === filterMetodoPago)
        }

        // Filtro tipo documento
        if (filterTipoDoc !== "all") {
            filtered = filtered.filter(v => v.tipo_documento === filterTipoDoc)
        }

        // Filtro anuladas
        if (filterAnulada === "active") {
            filtered = filtered.filter(v => !v.anulada)
        } else if (filterAnulada === "anulada") {
            filtered = filtered.filter(v => v.anulada)
        }


        // Filtro cajero
        if (filterCajero !== "all") {
            filtered = filtered.filter(v => v.perfil_id === filterCajero)
        }

        setFilteredVentas(filtered)
        setCurrentPage(1)
    }

    const viewDetails = async (venta: Venta) => {
        setSelectedVenta(venta)
        setShowDetailModal(true)

        try {
            const { data, error } = await supabase
                .from("detalle_ventas")
                .select(`
                    *,
                    productos (
                        nombre,
                        codigo_barras,
                        es_pesable
                    )
                `)
                .eq("venta_id", venta.id)

            if (error) throw error
            setDetalleVenta(data || [])
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido"
            toast.error("Error al cargar detalle", {
                description: message
            })
        }
    }

    const handleAnularVenta = async () => {
        if (!ventaToAnular) return
        setIsAnulando(true)

        try {
            // 1. Obtener detalles de la venta para saber qué stock devolver
            const { data: detalles, error: errorDetalles } = await supabase
                .from("detalle_ventas")
                .select("producto_id, cantidad")
                .eq("venta_id", ventaToAnular.id)

            if (errorDetalles) throw errorDetalles

            // 2. Ejecutar serie de actualizaciones
            // NOTA: Para cada ítem, devolvemos el stock
            if (detalles && detalles.length > 0) {
                for (const item of detalles) {
                    // Primero intentamos con un RPC si existe (incrementar_stock)
                    // Si falla o no existe, usamos actualización directa
                    const { error: errorStock } = await supabase.rpc('incrementar_stock', {
                        p_id: item.producto_id,
                        p_cantidad: item.cantidad
                    })

                    if (errorStock) {
                        // Si falla el RPC, intentamos actualización directa
                        const { data: pData } = await supabase
                            .from("productos")
                            .select("stock_cantidad")
                            .eq("id", item.producto_id)
                            .single()

                        if (pData) {
                            await supabase
                                .from("productos")
                                .update({ stock_cantidad: pData.stock_cantidad + item.cantidad })
                                .eq("id", item.producto_id)
                        }
                    }
                }
            }

            // 3. Marcar la venta como anulada
            const { error: errorVenta } = await supabase
                .from("ventas")
                .update({ anulada: true })
                .eq("id", ventaToAnular.id)

            if (errorVenta) throw errorVenta

            toast.success("Venta anulada correctamente", {
                description: "El stock ha sido devuelto al inventario."
            })

            setIsAnularModalOpen(false)
            fetchVentas() // Recargar la lista
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido"
            toast.error("Error al anular venta", {
                description: message
            })
        } finally {
            setIsAnulando(false)
            setVentaToAnular(null)
        }
    }

    const exportToCSV = () => {
        const headers = ["Fecha", "ID", "Tipo Doc", "Cliente", "RUT", "Método Pago", "Total", "Estado", "Cajero"]
        const rows = filteredVentas.map((v: Venta) => [
            format(new Date(v.created_at), "dd/MM/yyyy HH:mm", { locale: es }),
            v.id,
            v.tipo_documento,
            v.cliente_razon_social || "-",
            v.cliente_rut || "-",
            v.metodo_pago,
            v.total,
            v.anulada ? "Anulada" : "Activa",
            v.perfiles?.nombre_completo || "-"
        ])

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ventas_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Exportación completada")
    }

    const clearFilters = () => {
        setSearchTerm("")
        setDateFrom(undefined)
        setDateTo(undefined)
        setFilterMetodoPago("all")
        setFilterTipoDoc("all")
        setFilterMetodoPago("all")
        setFilterTipoDoc("all")
        setFilterAnulada("all")
        setFilterCajero("all")
    }

    useEffect(() => {
        fetchVentas()
        fetchCajeros()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [ventas, searchTerm, dateFrom, dateTo, filterMetodoPago, filterTipoDoc, filterAnulada, filterCajero])

    // Paginación
    const totalPages = Math.ceil(filteredVentas.length / itemsPerPage)
    const paginatedVentas = filteredVentas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Historial de Ventas</h1>
                <Button onClick={exportToCSV} disabled={filteredVentas.length === 0}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar CSV
                </Button>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Búsqueda */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por ID, RUT o Razón Social..."
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {(searchTerm || dateFrom || dateTo || filterMetodoPago !== "all" || filterTipoDoc !== "all" || filterAnulada !== "all" || filterCajero !== "all") && (
                            <Button variant="outline" onClick={clearFilters}>
                                <X className="w-4 h-4 mr-2" />
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {/* Filtros de fecha y selects */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Fecha Desde */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: es }) : "Desde"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                            </PopoverContent>
                        </Popover>

                        {/* Fecha Hasta */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: es }) : "Hasta"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                            </PopoverContent>
                        </Popover>

                        {/* Método de Pago */}
                        <Select value={filterMetodoPago} onValueChange={setFilterMetodoPago}>
                            <SelectTrigger>
                                <SelectValue placeholder="Método de Pago" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                <SelectItem value="Debito">Débito</SelectItem>
                                <SelectItem value="Credito">Crédito</SelectItem>
                                <SelectItem value="Transferencia">Transferencia</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Tipo Documento */}
                        <Select value={filterTipoDoc} onValueChange={setFilterTipoDoc}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo Documento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Boleta">Boleta</SelectItem>
                                <SelectItem value="Factura">Factura</SelectItem>
                            </SelectContent>
                        </Select>



                        {/* Estado */}
                        <Select value={filterAnulada} onValueChange={setFilterAnulada}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activas</SelectItem>
                                <SelectItem value="anulada">Anuladas</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Cajero */}
                        <Select value={filterCajero} onValueChange={setFilterCajero}>
                            <SelectTrigger>
                                <SelectValue placeholder="Cajero" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Cajeros</SelectItem>
                                {cajeros.map(cajero => (
                                    <SelectItem key={cajero.id} value={cajero.id}>
                                        {cajero.nombre_completo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Resumen */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Mostrando {filteredVentas.length} de {ventas.length} ventas</span>
                        <span>•</span>
                        <span>Total: ${filteredVentas.reduce((sum: number, v: Venta) => sum + (v.anulada ? 0 : v.total), 0).toLocaleString("es-CL")}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Ventas */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Tipo Doc</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Método Pago</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Cajero</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-64 text-center">
                                        Cargando ventas...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedVentas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                                        No se encontraron ventas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedVentas.map((venta: Venta) => (
                                    <TableRow key={venta.id} className={venta.anulada ? "opacity-50" : ""}>
                                        <TableCell className="font-mono text-sm">
                                            {format(new Date(venta.created_at), "dd/MM/yy HH:mm", { locale: es })}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {venta.id.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={venta.tipo_documento === "Factura" ? "default" : "secondary"}>
                                                {venta.tipo_documento}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {venta.cliente_razon_social ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{venta.cliente_razon_social}</span>
                                                    <span className="text-xs text-muted-foreground">{venta.cliente_rut}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{venta.metodo_pago}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ${venta.total.toLocaleString("es-CL")}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {venta.perfiles?.nombre_completo || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {venta.anulada ? (
                                                <Badge variant="destructive">Anulada</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Activa
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => viewDetails(venta)}
                                                    title="Ver Detalle"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {!venta.anulada && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            setVentaToAnular(venta)
                                                            setIsAnularModalOpen(true)
                                                        }}
                                                        title="Anular Venta"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Detalle */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Venta</DialogTitle>
                        <DialogDescription className="sr-only">
                            Muestra los productos y totales de la venta seleccionada.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVenta && (
                        <div className="space-y-4">
                            {/* Info de la venta */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Fecha</p>
                                    <p className="font-medium">
                                        {format(new Date(selectedVenta.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tipo Documento</p>
                                    <Badge>{selectedVenta.tipo_documento}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Método de Pago</p>
                                    <Badge variant="outline">{selectedVenta.metodo_pago}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cajero</p>
                                    <p className="font-medium">{selectedVenta.perfiles?.nombre_completo || "-"}</p>
                                </div>
                                {selectedVenta.cliente_razon_social && (
                                    <>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Cliente</p>
                                            <p className="font-medium">{selectedVenta.cliente_razon_social}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">RUT</p>
                                            <p className="font-medium">{selectedVenta.cliente_rut}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Productos */}
                            <div>
                                <h3 className="font-semibold mb-2">Productos</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio Unit.</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detalleVenta.map((item: DetalleVenta) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{item.productos?.nombre}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.productos?.codigo_barras || "Sin código"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.cantidad} {item.productos?.es_pesable ? 'kg' : 'un'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${item.precio_unitario.toLocaleString("es-CL")}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${item.subtotal.toLocaleString("es-CL")}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Total */}
                            <div className="flex justify-end p-4 bg-muted rounded-lg">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="text-2xl font-bold">
                                        ${selectedVenta.total.toLocaleString("es-CL")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog >

            {/* Modal de Confirmación de Anulación */}
            <Dialog open={isAnularModalOpen} onOpenChange={setIsAnularModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Ban className="w-5 h-5" />
                            Confirmar Anulación
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas anular esta venta? Esta acción devolverá los productos al inventario y marcará la venta como anulada de forma permanente.
                        </DialogDescription>
                    </DialogHeader>
                    {ventaToAnular && (
                        <div className="py-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">ID Venta:</span>
                                <span className="font-mono">{ventaToAnular.id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-bold">${ventaToAnular.total.toLocaleString("es-CL")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Fecha:</span>
                                <span>{format(new Date(ventaToAnular.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsAnularModalOpen(false)}
                            disabled={isAnulando}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleAnularVenta}
                            disabled={isAnulando}
                            className="flex-1"
                        >
                            {isAnulando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Anulando...
                                </>
                            ) : (
                                "Confirmar Anular"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
