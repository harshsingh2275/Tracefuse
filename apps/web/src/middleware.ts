import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection middleware per Section 23 & 37
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public assets and login bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check auth session cookie
  const authCookie = request.cookies.get("tracefuse_session");
  const isAuthenticated = authCookie?.value === "authenticated_analyst";

  // If trying to access protected routes without auth, redirect to login
  if (!isAuthenticated && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
