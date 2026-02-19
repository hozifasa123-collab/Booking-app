import { getAllServicesAction } from "@/app/actions/serviceActions";
import AllServicesClient from "@/components/services/AllServicesClient";

export default async function AllServicesPage() {
    // جلب البيانات مباشرة في السيرفر
    const services = await getAllServicesAction();

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Available Services</h1>
                    <p className="text-muted-foreground">Find the perfect service based on your needs.</p>
                </div>
            </header>

            {/* الكرينة اللي فيها البحث والفلترة */}
            <AllServicesClient initialServices={services} />
        </div>
    );
}