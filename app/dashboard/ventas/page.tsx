"use client"

import { useState, useEffect } from "react"
import { getRecentSales, anularVenta } from "@/actions/sales"
import { getSession } from "@/actions/auth"
import { SalesList } from "@/components/pos/sales-list"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { FileText, Search, RefreshCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SaleDetailsModal } from "@/components/pos/sale-details-modal"

export default function VentasPage() {
    const [sales, setSales] = useState<any[]>([])
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    useEffect(() => {
        const init = async () => {
            const sessionResult = await getSession()
            if (sessionResult.success && sessionResult.profile) {
                setTenantId(sessionResult.profile.tenant_id)
                fetchSales(sessionResult.profile.tenant_id)
            } else {
                setLoading(false)
            }
        }
        init()
    }, [])

    const fetchSales = async (tenantId: string) => {
        setLoading(true)
        const result = await getRecentSales(tenantId, 50)
        if (result.success) {
            setSales(result.data || [])
        } else {
            toast.error("Error al cargar ventas: " + result.error)
        }
        setLoading(false)
    }

    const handleAnular = async (id: string) => {
        if (!confirm("¿Está seguro de anular esta venta? El stock será devuelto al inventario.")) return

        setProcessingId(id)
        const result = await anularVenta(id)
        if (result.success) {
            toast.success("Venta anulada correctamente")
            if (tenantId) fetchSales(tenantId)
        } else {
            toast.error("Error al anular: " + result.error)
        }
        setProcessingId(null)
    }

    const filteredSales = sales.filter(s =>
        s.numero_venta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const exportToCSV = () => {
        const headers = ["Numero Venta", "Fecha", "Cliente", "Total", "Metodo Pago", "Estado"]
        const rows = filteredSales.map(v => [
            v.numero_venta,
            format(new Date(v.fecha), "yyyy-MM-dd HH:mm"),
            `"${v.cliente_nombre || "Publico General"}"`,
            v.total,
            v.metodo_pago.replace("_", " "),
            v.estado
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.body.appendChild(document.createElement("a"))
        link.href = url
        link.download = `ventas_${format(new Date(), "yyyy-MM-dd")}.csv`
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historial de Ventas</h1>
                    <p className="text-muted-foreground italic">Registro de todas las transacciones realizadas en el POS.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => tenantId && fetchSales(tenantId)} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Ventas Recientes
                    </CardTitle>
                    <CardDescription>
                        Filtre y visualice las ventas del día y meses anteriores.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por N° Venta o Cliente..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <SalesList
                        sales={filteredSales}
                        loading={loading}
                        onAnular={handleAnular}
                        onView={(id) => {
                            setSelectedSaleId(id)
                            setIsDetailsOpen(true)
                        }}
                        processingId={processingId}
                    />
                </CardContent>
            </Card>

            <SaleDetailsModal
                saleId={selectedSaleId}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    )
}
