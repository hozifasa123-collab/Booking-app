import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // استيراد الإعدادات من الملف الجديد

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };