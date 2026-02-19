import { getMyBookingsAction } from "@/app/actions/bookingActions";
import BookingsListClient from "@/components/my-bookings/BookingsListClient";

export default async function MyBookingsPage() {
    const result = await getMyBookingsAction(); // استدعاء الأكشن مباشرة في السيرفر
    const bookings = result.success ? result.data : [];

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Bookings</h1>
                <p className="text-muted-foreground">Track and manage your service appointments.</p>
            </header>

            {/* نرسل البيانات للمكون الذي سيتعامل مع الفلاتر والأزرار */}
            <BookingsListClient initialBookings={bookings} />
        </div>
    );
}