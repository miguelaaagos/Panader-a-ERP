import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getTenantBranding } from "@/lib/server/subscription";
import { getRequiredFeatureForPath, hasFeatureAccess } from "@/lib/subscription";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const branding = await getTenantBranding();

    // Protección de rutas del lado del servidor
    const headersList = await headers();
    const urlStr = headersList.get("x-url") || "";
    if (urlStr) {
        const url = new URL(urlStr, "http://localhost");
        const pathname = url.pathname;
        const requiredFeature = getRequiredFeatureForPath(pathname);

        if (requiredFeature && !hasFeatureAccess(branding.tier, requiredFeature)) {
            redirect("/dashboard");
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar branding={branding} />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Topbar branding={branding} />
                <main className="flex-1 p-6 bg-muted/10">
                    {children}
                </main>
            </div>
        </div>
    );
}
