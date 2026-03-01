import { createServerClient } from "@supabase/ssr"
import { type EmailOtpType } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

function getSafeNextPath(nextParam: string | null): string {
    if (!nextParam) return "/dashboard"
    if (!nextParam.startsWith("/")) return "/dashboard"
    if (nextParam.startsWith("//")) return "/dashboard"
    return nextParam
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type") as EmailOtpType | null
    const next = getSafeNextPath(searchParams.get("next"))

    if (token_hash && type) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (!error) {
            return NextResponse.redirect(new URL(next, request.url))
        }
    }

    // Redirect the user to an error page with some instructions
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
}
