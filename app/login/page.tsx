"use client";

import { useState, useEffect, Suspense } from "react"; // 1. أضفنا Suspense هنا
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

// 2. أنشأنا مكون جديد اسمه LoginForm ليحتوي على كل المنطق (Logic)
function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    useEffect(() => {
        if (errorParam === "suspended") {
            signOut({ redirect: false });
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
                const session = await getSession() as any;
                toast.success("Welcome back!");

                if (session?.user?.role === "admin") {
                    window.location.href = "/admin";
                } else {
                    window.location.href = "/dashboard";
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
                    {errorParam === "suspended" && (
                        <div className="mb-4 flex items-center gap-2 p-3 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50 animate-in fade-in zoom-in duration-300">
                            <AlertCircle className="h-4 w-4" />
                            <span>Your account has been suspended.</span>
                        </div>
                    )}

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
                            <Label htmlFor="password">Password</Label>
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

// 3. المكون الأساسي الآن يقوم بتغليف LoginForm داخل Suspense
export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}