"use client";

import { useState, useEffect } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle } from "lucide-react"; // أيقونة للتحذير

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // سحب الـ error من الرابط (الذي يرسله الميدل وير)
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    useEffect(() => {
        if (errorParam === "suspended") {
            // مسح الكوكيز والتوكن القديم من المتصفح
            import("next-auth/react").then(({ signOut }) => {
                signOut({ redirect: false });
            });
        }
    }, [errorParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                if (res.error.includes("suspended")) {
                    toast.error("Access Denied: Your account is suspended.");
                    router.replace("/login");
                } else {
                    toast.error("Invalid Email or Password");
                }
            } else {
                // 2. هنا بقى "الذكاء": هنجيب بيانات الجلسة اللي لسه فاتحة حالاً
                const session = await getSession() as any;

                toast.success("Welcome back!");

                // 3. التوجيه بناءً على الرتبة (Role)
                if (session?.user?.role === "admin") {
                    window.location.href = "/admin"; // الأدمن يروح لمملكته
                } else {
                    window.location.href = "/dashboard"; // المستخدم يروح لخدماته
                }
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold">Login</CardTitle>
                    <CardDescription>
                        Enter your email and password to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                            {loading ? "Logging in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary font-semibold hover:underline">
                            Register now
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}