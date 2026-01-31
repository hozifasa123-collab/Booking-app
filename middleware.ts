// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        /*
         * المسارات التي نريد حمايتها
         */
        "/dashboard/:path*",
        "/settings/:path*",
        "/bookings/:path*",
        /*
         * تعديل الاستثناء ليشمل login و register والصفحة الرئيسية /
         */
        "/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|public|$).*)",
    ],
};