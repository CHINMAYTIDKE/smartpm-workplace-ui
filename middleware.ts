import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login"];

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // For now, we'll skip auth check in middleware since Firebase auth is client-side
    // In production, you'd want to verify Firebase ID tokens server-side

    // Allow all requests to pass through
    // Client-side auth guards in components will handle redirects
    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
