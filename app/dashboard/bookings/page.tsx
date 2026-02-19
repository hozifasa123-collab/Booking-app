import { getIncomingBookingsAction } from "@/app/actions/bookingActions";
import IncomingBookingsClient from "@/components/bookings/IncomingBookingsClient";

export default async function IncomingBookingsPage() {
    // جلب البيانات مباشرة من السيرفر قبل رندر الصفحة
    const result = await getIncomingBookingsAction();
    const bookings = result.success ? result.data : [];

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Incoming Bookings</h1>
                <p className="text-muted-foreground">Detailed view of your clients' appointments.</p>
            </header>

            {/* تمرير البيانات للمكون التفاعلي */}
            <IncomingBookingsClient initialBookings={bookings} />
        </div>
    );
}