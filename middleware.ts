// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token as any; // Casting to access .role and .status
        const path = req.nextUrl.pathname;

        if (path === "/login") {
            return NextResponse.next();
        }

        // 1. حماية "التبنيد": لو المستخدم موقوف، اطرده لصفحة اللوجن مع رسالة خطأ
        if (token?.status === "suspended") {
            // سنقوم بتوجيهه للوجن ونضيف باراميتر error=suspended
            return NextResponse.redirect(new URL("/login?error=suspended", req.url));
        }

        // 2. حماية الأدمن: منع غير الإدمن من دخول صفحات /admin
        if (path.startsWith("/admin") && token?.role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/settings/:path*",
        "/bookings/:path*",
        "/admin/:path*",
        // هذا السطر يستثني الملفات العامة وصفحات اللوجن والريجستر
        "/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|public|$).*)",
    ],
};