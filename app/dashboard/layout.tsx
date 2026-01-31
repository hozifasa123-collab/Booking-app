import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/mobile-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full relative">
      {/* السايدبار للشاشات الكبيرة */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>

      {/* محتوى الصفحة */}
      <main className="md:pl-72">
        {/* Navbar للجوال فقط */}
        <div className="flex items-center p-4 md:hidden bg-[#111827]">
          <MobileSidebar />
          <div className="ml-4 font-bold text-white">BookingApp</div>
        </div>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}