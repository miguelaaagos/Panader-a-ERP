import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Users,
    Building2,
    CreditCard,
    TrendingUp,
    ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalAuditLogs } from "@/actions/admin";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Verificar que el usuario sea super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (profile?.rol !== "super_admin") {
        redirect("/dashboard");
    }

    // Obtener estadísticas globales
    const [
        { count: totalTenants },
        { count: totalUsers },
        { data: activeSubscriptions }
    ] = await Promise.all([
        supabase.from("tenants").select("*", { count: "exact", head: true }),
        supabase.from("usuarios").select("*", { count: "exact", head: true }),
        supabase.from("tenants").select("subscription_tier")
    ]);

    const proPlans = activeSubscriptions?.filter((t: { subscription_tier: string | null }) => t.subscription_tier === 'pro').length || 0;

    const stats = [
        {
            title: "Total Tenants",
            value: totalTenants || 0,
            icon: Building2,
            description: "Empresas registradas en la plataforma",
            color: "text-blue-500"
        },
        {
            title: "Usuarios Globales",
            value: totalUsers || 0,
            icon: Users,
            description: "Total de cuentas activas",
            color: "text-green-500"
        },
        {
            title: "Suscripciones Pro",
            value: proPlans,
            icon: CreditCard,
            description: "Tenants con plan profesional",
            color: "text-purple-500"
        },
        {
            title: "Estado Plataforma",
            value: "Activo",
            icon: ShieldCheck,
            description: "Todos los servicios operacionales",
            color: "text-emerald-500"
        }
    ];

    // Obtener logs de auditoría
    const { data: auditLogs } = await getGlobalAuditLogs();

    return (
        <div className="container mx-auto space-y-8 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-serif text-primary md:text-4xl">
                    Panel de Control Global
                </h1>
                <p className="text-muted-foreground">
                    Administración general del ERP Multi-tenant
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Auditoría de Acciones Globales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AuditLogTable logs={auditLogs as any || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
