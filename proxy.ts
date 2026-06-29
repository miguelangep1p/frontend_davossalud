import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  let isTokenExpired = false;
  if (token) {
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          isTokenExpired = true;
        }
      }
    } catch {
      isTokenExpired = true;
    }
  }

  if (token && isTokenExpired) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token && !isTokenExpired ? "/dashboard" : "/login", request.url),
    );
  }

  if (!PUBLIC_ROUTES.includes(pathname) && (!token || isTokenExpired)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC_ROUTES.includes(pathname) && token && !isTokenExpired) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/personal/:path*",
    "/usuarios/:path*",
    "/pacientes/:path*",
    "/citas/:path*",
    "/historia-clinica/:path*",
    "/recetas/:path*",
    "/tratamientos/:path*",
    "/productos/:path*",
    "/caja/:path*",
    "/login",
  ],
};
