import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getTenantTier } from "@/lib/server/subscription";
import { getRequiredFeatureForPath, hasFeatureAccess } from "@/lib/subscription";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tier = await getTenantTier();

    // Protección de rutas del lado del servidor
    const headersList = await headers();
    const urlStr = headersList.get("x-url") || "";
    if (urlStr) {
        const url = new URL(urlStr, "http://localhost");
        const pathname = url.pathname;
        const requiredFeature = getRequiredFeatureForPath(pathname);

        if (requiredFeature && !hasFeatureAccess(tier, requiredFeature)) {
            redirect("/dashboard");
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar tier={tier} />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Topbar tier={tier} />
                <main className="flex-1 p-6 bg-muted/10">
                    {children}
                </main>
            </div>
        </div>
    );
}
