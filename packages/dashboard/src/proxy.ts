import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // NOTE: For ZMS Community Edition, we use localStorage as the primary session store
  // due to cross-port issues between localhost:3000 and the engine port (e.g. 3030).
  // Cookie-based protection is disabled here and handled by client-side AuthGuard.
  
  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
