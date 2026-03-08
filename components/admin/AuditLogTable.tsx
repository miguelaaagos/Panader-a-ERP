"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ShieldAlert } from "lucide-react"

interface AuditLog {
    id: string
    created_at: string
    action: string
    entity_type: string
    entity_id: string
    usuarios?: {
        nombre_completo: string
        email: string
    }
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <ShieldAlert className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm italic">No hay registros de auditoría recientes.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[180px]">Fecha</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Entidad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-xs">
                                {format(new Date(log.created_at), "PPp", { locale: es })}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                        {log.usuarios?.nombre_completo || "Sistema"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                        {log.usuarios?.email}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5">
                                    {log.action.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="capitalize text-primary/70">{log.entity_type}</span>
                                    <span className="text-muted-foreground opacity-50">
                                        ({log.entity_id.split('-')[0]})
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
