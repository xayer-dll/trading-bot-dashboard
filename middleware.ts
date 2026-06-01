import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Korumalı olmayan rotalar
const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const auth = request.cookies.get("dashboard_auth")?.value;
  const secret = process.env.DASHBOARD_SECRET ?? "secret_token_123";

  const isPublic = PUBLIC.some(p => pathname.startsWith(p));

  // Giriş yapmamış → login'e yönlendir
  if (!isPublic && auth !== secret) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Zaten giriş yapmış → login sayfasına gitmesin
  if (pathname === "/login" && auth === secret) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
