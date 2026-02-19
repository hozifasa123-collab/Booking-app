// lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials: any) {
                const { email, password } = credentials;
                try {
                    await connectMongoDB();
                    const user = await User.findOne({ email, isDeleted: { $ne: true } });
                    if (!user) {
                        throw new Error("email");
                    };;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (!passwordsMatch) {
                        throw new Error("password");
                    };

                    if (user.status === "suspended") {
                        throw new Error("suspended");
                    }

                    // نرجع الكائن ونضيف الـ id يدوياً لضمان التعرف عليه
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status,
                        warnings: user.warnings,
                    };
                } catch (error: any) {
                    console.log("Error: ", error);
                    throw new Error(error.message);
                }
            },
        }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = (user as any).id;
                token.name = user.name;
                token.email = user.email;
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.warnings = (user as any).warnings;
            }

            if (trigger === "update" && session?.user) {
                token.name = session.user.name;
                token.email = session.user.email;
                // تحديث البيانات الإضافية لو تم تمريرها في الـ update
                if (session.user.role) token.role = session.user.role;
                if (session.user.status) token.status = session.user.status;
            }

            return token;
        },
        async session({ session, token }) {
            // حل مشكلة "possibly undefined" و "Property id does not exist"
            if (session.user) {
                const userSession = session.user as any;
                userSession.id = token.id;
                userSession.name = token.name;
                userSession.email = token.email;
                userSession.role = token.role;
                userSession.status = token.status;
                userSession.warnings = token.warnings;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};