"use client";

import { Refine, AuthProvider } from "@refinedev/core";
import { dataProvider } from "@refinedev/supabase";
import routerProvider from "@refinedev/nextjs-router";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client outside the component to avoid recreating on every render
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

export function RefineProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();


    // Only run client-side hooks after mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Custom Auth Provider to handle our specific requirements if needed
    // For now using the default one from @refinedev/supabase but we might need to override getIdentity
    // Custom Auth Provider
    const customAuthProvider: AuthProvider = {
        login: async ({ email, password, providerName }) => {
            if (providerName) {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: providerName as any,
                });
                if (error) return { success: false, error };
                return { success: true };
            }
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) return { success: false, error };
            return { success: true, redirectTo: "/dashboard" };
        },
        logout: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) return { success: false, error };
            return { success: true, redirectTo: "/login" };
        },
        check: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) return { authenticated: true };
            return { authenticated: false, redirectTo: "/login" };
        },
        onError: async (error) => {
            console.error(error);
            return { error };
        },
        getIdentity: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return null;

            // Fetch user profile with tenant info
            const { data: profile } = await supabase
                .from("usuarios")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profile) {
                return {
                    ...user,
                    ...profile,
                    rol: profile.rol, // Explicitly map rol for useUserRole hook
                    nombre_completo: profile.nombre_completo,
                    name: profile.nombre_completo || user.email,
                };
            }

            return user;
        },

    };


    return (
        <QueryClientProvider client={queryClient}>
            {!mounted ? (
                // Before hydration, render children without Refine
                <>{children}</>
            ) : (
                // After hydration, render full Refine setup
                <Refine
                    dataProvider={dataProvider(supabase)}
                    authProvider={customAuthProvider}
                    routerProvider={routerProvider}
                    resources={[
                        {
                            name: "inventario",
                            list: "/dashboard/inventario",
                            create: "/dashboard/inventario/create",
                            edit: "/dashboard/inventario/edit/:id",
                            show: "/dashboard/inventario/show/:id",
                            meta: {
                                label: "Inventario",
                            }
                        },
                        {
                            name: "ventas",
                            list: "/dashboard/ventas",
                            create: "/dashboard/ventas/nueva",
                            show: "/dashboard/ventas/show/:id",
                            meta: {
                                label: "Ventas",
                            }
                        },
                        {
                            name: "recetas",
                            list: "/dashboard/recetas",
                            meta: {
                                label: "Recetas",
                            }
                        },
                        {
                            name: "produccion",
                            list: "/dashboard/produccion",
                            meta: {
                                label: "Producción",
                            }
                        },
                        {
                            name: "analytics",
                            list: "/dashboard/analytics",
                            meta: {
                                label: "Analytics",
                            }
                        }
                    ]}
                    options={{
                        syncWithLocation: true,
                        warnWhenUnsavedChanges: true,
                        projectId: "panaderia-erp-refine",
                    }}
                >
                    {children}
                </Refine>
            )}
        </QueryClientProvider>
    );
}
