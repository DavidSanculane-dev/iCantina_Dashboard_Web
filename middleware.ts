import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "icantina_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/logout") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return isApi
      ? NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
    return NextResponse.next();
  } catch {
    if (isApi) return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
