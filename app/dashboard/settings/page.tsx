import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/settings/SettingsForm";

interface UserDocument {
    _id: string;
    name: string;
    email: string;
    phone: string;
    warnings: string;
    role: string;
    isDeleted?: boolean;
    // أضف باقي الحقول هنا
}

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    await connectMongoDB();
    // جلب بيانات المستخدم كاملة من السيرفر
    const user = await User.findOne({ email: session.user?.email }).lean() as UserDocument | null;
    if (!user || user.isDeleted) redirect("/login");

    // تجهيز البيانات للكرينة (Client Component)
    const userData = {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        warnings: user.warnings || 0,
        role: user.role || "user"
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-zinc-500">Control your personal data and account permissions.</p>
            </header>

            <SettingsForm user={userData} />
        </div>
    );
}