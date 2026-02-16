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


    useEffect(() => {
        setMounted(true);
    }, []);

    // Custom Auth Provider
    const customAuthProvider: AuthProvider = {
        login: async ({ email, password, providerName }) => {
            if (providerName) {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: providerName as any,
                });
                if (error) {
                    console.error("[AuthProvider] OAuth Error:", error);
                    return { success: false, error };
                }
                return { success: true };
            }
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    console.error("[AuthProvider] Login Error:", error);
                    return { success: false, error };
                }

                // Ensure cookies are synchronized by using a hard redirect
                if (typeof window !== "undefined") {
                    window.location.href = "/dashboard";
                }
                return { success: true };
            } catch (err) {
                console.error("[AuthProvider] Unexpected Error:", err);
                return { success: false, error: err as any };
            }
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
            console.error("[AuthProvider] Global error handler:", error);
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
                    rol: profile.rol,
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
