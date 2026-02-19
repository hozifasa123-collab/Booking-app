import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm"; // استدعاء المكون من فولدر الكومبوننتس

export default function RegisterPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>Join our booking platform today.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* هنا بنحط مكون الكلاينت */}
                    <RegisterForm />

                    <div className="mt-6 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary font-semibold hover:underline">
                            Login now
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}