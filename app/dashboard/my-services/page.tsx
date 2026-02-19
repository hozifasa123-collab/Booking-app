import { getMyServicesAction } from "@/app/actions/serviceActions";
import MyServicesClient from "@/components/my-services/MyServicesClient";

export default async function MyServicesPage() {
    // جلب البيانات مباشرة من السيرفر
    const result = await getMyServicesAction();
    const services = result.success ? result.data : [];

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Services</h1>
                <p className="text-muted-foreground">Monitor your performance and manage your offerings.</p>
            </div>

            {/* إرسال البيانات للـ Client Component للتعامل مع البحث والفلترة */}
            <MyServicesClient initialServices={services} getMyServicesAction={getMyServicesAction} />
        </div>
    );
}