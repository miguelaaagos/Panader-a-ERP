import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const supabase = await createClient();

    // Solo permitimos el acceso si hay una sesión activa
    // En el flujo de recuperación, verifyOtp establece la sesión
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?error=unauthorized");
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <ResetPasswordForm />
            </div>
        </div>
    );
}
