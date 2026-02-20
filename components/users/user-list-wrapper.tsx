import { createClient } from "@/lib/supabase/server"
import { UserList } from "./user-list"

export async function UserListWrapper() {
    const supabase = await createClient()

    // Get current user to prevent self-deactivation
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch users (profiles)
    const { data: profiles, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error loading profiles:", error)
        return <div className="text-red-500">Error cargando usuarios</div>
    }

    return <UserList users={(profiles || []).map(p => ({ ...p, activo: p.activo ?? undefined }))} currentUserId={user?.id} />
}
