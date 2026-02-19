import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { redirect } from "next/navigation";
import { 
    LayoutGrid, Clock, XCircle, 
    CheckCircle2, CalendarDays, Users 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
    // 1. التحقق من الجلسة في السيرفر (أسرع وأأمن)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    await connectMongoDB();

    // 2. جلب البيانات مباشرة من الداتابيز (Server-side)
    const [
        totalServices,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        totalBookings,
        uniqueClients
    ] = await Promise.all([
        Service.countDocuments({ ownerId: userId, isDeleted: false }),
        Booking.countDocuments({
            providerId: userId,
            status: "confirmed",
            startTime: { $gt: new Date() },
            statusAdminDelete: 'no'
        }),
        Booking.countDocuments({ providerId: userId, status: "cancelled", statusAdminDelete: 'no' }),
        Booking.countDocuments({
            providerId: userId,
            status: "confirmed",
            startTime: { $lt: new Date() },
            statusAdminDelete: 'no'
        }),
        Booking.countDocuments({ providerId: userId, statusAdminDelete: 'no' }),
        Booking.distinct("clientId", { providerId: userId, statusAdminDelete: 'no' })
    ]);

    const cards = [
        { title: "Total Services", value: totalServices, icon: LayoutGrid, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Total Bookings", value: totalBookings, icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Pending Bookings", value: pendingBookings, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Cancelled Bookings", value: cancelledBookings, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        { title: "Completed Bookings", value: completedBookings, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Unique Clients", value: uniqueClients.length, icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}