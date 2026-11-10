import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
 
export async function middleware(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
 
    if(!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
 
    return NextResponse.next();
}
 
export const config = {
  runtime: "nodejs",
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/purchase-bills/:path*",
    "/clients/:path*",
    "/suppliers/:path*",
    "/items/:path*",
    "/inventory/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/approvals/:path*",
  ], // Protect all authenticated route groups
};