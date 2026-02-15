import { Suspense } from "react"
import { POSContainer } from "@/components/pos/pos-container"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { ShoppingCart, Store } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Punto de Venta | POS",
}

export default function POSPage() {
    return (
        <RoleGuard permission="sales.create">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Punto de Venta</h1>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Store className="h-3 w-3" />
                                <span>Terminal de Caja #1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Suspense fallback={<POSLoading />}>
                    <POSContainer />
                </Suspense>
            </div>
        </RoleGuard>
    )
}

function POSLoading() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
            </div>
            <div className="lg:col-span-4">
                <Skeleton className="h-full rounded-xl" />
            </div>
        </div>
    )
}
