import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Building2 } from "lucide-react";
import { SubscriptionDialog } from "@/components/admin/SubscriptionDialog";

export default async function TenantsAdminPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (profile?.rol !== "super_admin") redirect("/dashboard");

    const { data: tenants } = await supabase
        .from("tenants")
        .select(`
            *,
            usuarios:usuarios(count)
        `)
        .order("created_at", { ascending: false });

    return (
        <div className="container mx-auto space-y-8 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-serif text-primary md:text-3xl">
                    Gestión de Panaderías (Tenants)
                </h1>
                <p className="text-muted-foreground">
                    Control centralizado de locales y planes de suscripción
                </p>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Negocio</TableHead>
                            <TableHead>Estado Plan</TableHead>
                            <TableHead>Fecha Registro</TableHead>
                            <TableHead>Usuarios</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants?.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            {tenant.name}
                                            <p className="text-xs text-muted-foreground font-normal">
                                                ID: {tenant.id.split('-')[0]}...
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={tenant.subscription_tier === 'pro' ? 'default' : 'outline'}>
                                        {tenant.subscription_tier?.toUpperCase() || 'INITIAL'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(tenant.created_at), "PPP", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <span className="font-semibold text-primary/80">
                                        {(tenant.usuarios as unknown as [{ count: number }])?.[0]?.count ?? 0}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <SubscriptionDialog
                                        tenantId={tenant.id}
                                        tenantName={tenant.name}
                                        currentTier={tenant.subscription_tier as 'initial' | 'advanced' | 'pro'}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
