"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Power, PowerOff } from "lucide-react"
import { toggleUserStatus } from "@/actions/users"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { EditUserDialog } from "@/components/users/edit-user-dialog"

interface User {
    id: string
    nombre_completo: string
    rol: string
    created_at: string
    activo?: boolean
    email?: string
}

interface UserListProps {
    users: User[]
    currentUserId?: string
}

export function UserList({ users, currentUserId }: UserListProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleToggleStatus = async (user: User) => {
        if (user.id === currentUserId) {
            toast.error("No puedes desactivar tu propia cuenta")
            return
        }

        setLoadingId(user.id)
        try {
            const currentStatus = user.activo !== false // Default to true if undefined
            const result = await toggleUserStatus(user.id, currentStatus)

            if (result.success) {
                toast.success(`Usuario ${currentStatus ? 'desactivado' : 'activado'} correctamente`)
            } else {
                toast.error(result.error || "Error al cambiar estado")
            }
        } catch (error) {
            toast.error("Error desconocido")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const isMyself = user.id === currentUserId
                        return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.nombre_completo}
                                    {isMyself && <span className="ml-2 text-xs text-muted-foreground">(Tú)</span>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.rol === "admin" ? "default" : "secondary"}>
                                        {user.rol === "admin" ? "Administrador" : "Cajero"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.activo !== false ? "outline" : "destructive"} className={user.activo !== false ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                        {user.activo !== false ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <EditUserDialog user={user} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleStatus(user)}
                                            disabled={loadingId === user.id || isMyself}
                                            title={isMyself ? "No puedes desactivar tu propia cuenta" : (user.activo !== false ? "Desactivar" : "Activar")}
                                            className={isMyself ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                            {user.activo !== false ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-green-600" />}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No se encontraron usuarios.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
