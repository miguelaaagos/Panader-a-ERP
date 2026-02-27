import { validateRequest } from "@/lib/server/auth"
import { UserProfileForm } from "@/components/users/user-profile-form"
import { Separator } from "@/components/ui/separator"

export default async function PerfilPage() {
    const { profile } = await validateRequest()

    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Mi Perfil</h2>
                <p className="text-muted-foreground">
                    Gestiona tu información personal y seguridad de tu cuenta.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-4xl">
                    <UserProfileForm
                        initialData={{
                            nombre_completo: profile.nombre_completo || "",
                            email: profile.email || ""
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
