import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
    // Create an unmodified response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, {
                            ...options,
                            secure: process.env.NODE_ENV === 'production',
                        });
                    });
                },
            },
        }
    );

    // This will refresh the session if it's expired
    const { data: { user } } = await supabase.auth.getUser();

    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        // Important: Copy cookies to the redirect response
        const redirectResponse = NextResponse.redirect(url);
        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
    }

    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        // Important: Copy cookies to the redirect response
        const redirectResponse = NextResponse.redirect(url);
        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
    }

    return response;
};
