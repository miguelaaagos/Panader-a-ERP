"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];

export function useProfile() {
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function getProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("perfiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (error) throw error;
                setPerfil(data);
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            } finally {
                setLoading(false);
            }
        }

        getProfile();
    }, [supabase]);

    return { perfil, loading };
}
