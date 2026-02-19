// api/dashboard

import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // 1. التحقق من الجلسة والمستخدم بشكل صارم
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. استخدام (as any) للوصول لـ id المستخدم بأمان في TypeScript
        const userId = (session.user as any).id;

        await connectMongoDB();

        // تنفيذ كل الطلبات في وقت واحد لسرعة الاستجابة
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

            Booking.countDocuments({ providerId: userId, status: "cancelled",statusAdminDelete: 'no' }),

            Booking.countDocuments({
                providerId: userId,
                status: "confirmed",
                startTime: { $lt: new Date() },
                statusAdminDelete: 'no'
            }),

            Booking.countDocuments({ providerId: userId,statusAdminDelete: 'no' }),

            Booking.distinct("clientId", { providerId: userId,statusAdminDelete: 'no' })
        ]);

        return NextResponse.json({
            totalServices,
            pendingBookings,
            cancelledBookings,
            completedBookings,
            totalBookings,
            uniqueClientsCount: uniqueClients.length
        });
    } catch (error) {
        console.error("Stats Error:", error);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
