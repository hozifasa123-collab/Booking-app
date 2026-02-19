// api/bookings/incoming

import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // 1. التحقق الصارم من الجلسة (لإرضاء TypeScript)
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. استخدام as any للوصول لمعرف المستخدم
        const userId = (session.user as any).id;

        await connectMongoDB();

        // 3. جلب الحجوزات مع Populate لبيانات الخدمة والعميل
        const bookings = await Booking.find({
            providerId: userId,
            statusAdminDelete: "no"
        })
            .populate("serviceId")
            .populate("clientId", "name email phone") // جلب بيانات العميل المختارة فقط
            .sort({ startTime: -1 }); // ترتيب الحجوزات من الأحدث للأقدم

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching incoming bookings:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}