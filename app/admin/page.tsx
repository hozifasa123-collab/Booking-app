import { getAllAdminDataAction } from "@/app/actions/adminActions";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin Control Panel | System Oversight",
};

export default async function AdminPage() {
    // جلب البيانات مباشرة من السيرفر قبل رندر الصفحة
    const data = await getAllAdminDataAction();

    if (!data.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-red-400 font-mono">
                <p>CRITICAL_SYSTEM_ERROR: {data.error}</p>
            </div>
        );
    }

    return (
        <main className="bg-[#0f172a] min-h-screen">
            {/* نمرر البيانات الجاهزة للمكون التفاعلي */}
            <AdminDashboardClient initialData={data} />
        </main>
    );
}