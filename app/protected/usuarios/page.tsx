import { Suspense } from "react"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { UserListWrapper } from "@/components/users/user-list-wrapper"

export default function UsuariosPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <CreateUserDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Lista de Usuarios
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Cargando lista de usuarios...</div>}>
                        <UserListWrapper />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
