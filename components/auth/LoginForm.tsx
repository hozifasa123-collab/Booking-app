"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react"; // بنستخدم دي هنا في v4
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                // Handling specific errors thrown from authOptions
                if (res.error === "suspended") {
                    toast.error("Access Denied: Your account is suspended.");
                } else if (res.error === "email") {
                    toast.error("No account found with this email.");
                } else if (res.error === "password") {
                    toast.error("Incorrect password.");
                } else {
                    toast.error("Invalid credentials. Please try again.");
                }
                return; // Stop execution here
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label>Email Address</label>
                <Input name="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
                <label>Password</label>
                <Input name="password" type="password" required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Sign In"}
            </Button>
        </form>
    );
}