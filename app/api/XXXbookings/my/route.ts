// api/bookings/my

import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        // 1. جلب الجلسة الحالية
        const session = await getServerSession(authOptions);

        // 2. التحقق من صلاحية الوصول
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 3. استخراج الـ ID وتحويله لـ ObjectId لضمان عمل الفلترة في MongoDB
        const userId = (session.user as any).id;
        
        // 4. الاتصال بقاعدة البيانات
        await connectMongoDB();

        // 5. جلب البيانات مع الـ Populate اللازم
        const bookings = await Booking.find({
            clientId: userId,
            statusCustomerDelete: "no"
        })
        .populate({
            path: "serviceId",
            populate: {
                path: "ownerId", // تأكد أن اسم الموديل مطابق لما في قاعدة بياناتك
                select: "name phone email"
            }
        })
        .sort({ startTime: -1 });

        // 6. إرجاع النتيجة
        return NextResponse.json(bookings);
        
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: String(error) }, 
            { status: 500 }
        );
    }
}
