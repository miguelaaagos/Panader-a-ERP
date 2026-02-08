import { ConfigForm } from "@/components/config/config-form"
import { Separator } from "@/components/ui/separator"

export default function ConfigPage() {
    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                <p className="text-muted-foreground">
                    Administra los datos generales de tu negocio.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-2xl">
                    <ConfigForm />
                </div>
            </div>
        </div>
    )
}
