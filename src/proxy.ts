import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";

export const config = {
  matcher: ["/", "/chat/:path*"],
};

export const proxy = auth((request: NextAuthRequest) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth?.user);

  if (pathname === "/" && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/chat") && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});
