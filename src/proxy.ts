import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /ch68 routes except for /ch68/login
  if (pathname.startsWith("/ch68") && pathname !== "/ch68/login") {
    const sessionToken =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionToken) {
      const loginUrl = new URL("/ch68/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from the login page
  if (pathname === "/ch68/login") {
    const sessionToken =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__Secure-better-auth.session_token");

    if (sessionToken) {
      return NextResponse.redirect(new URL("/ch68", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ch68/:path*"],
};
