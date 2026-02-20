import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Supabase SSR Proxy Pattern — oficial
// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() puede lanzar AuthApiError si el refresh token expiró/es inválido.
  // En ese caso, limpiamos las cookies corruptas para forzar re-login limpio.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err: unknown) {
    const isStaleToken =
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "refresh_token_not_found"

    if (!isStaleToken) {
      console.error("[proxy] Unexpected auth error:", err)
    }

    // Limpiar cookies de auth inválidas para que el navegador haga logout limpio
    const response = NextResponse.redirect(new URL("/login", request.url))
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        response.cookies.delete(cookie.name)
      }
    })
    return response
  }

  const pathname = request.nextUrl.pathname
  const isProtectedRoute = pathname.startsWith("/dashboard")
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
