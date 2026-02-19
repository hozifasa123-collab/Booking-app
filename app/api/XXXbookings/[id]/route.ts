// api/bookings/[id]

import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Service from "@/models/Service";

// تأكد من إضافة async لـ params كـ Promise
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // السحر هنا: يجب عمل await للـ params قبل استخراج الـ id
        const { id } = await params;
        const userId = (session.user as any).id;

        await connectMongoDB();

        // 1. جلب الحجز للتأكد من أطراف العلاقة
        const booking = await Booking.findById(id);
        if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

        let updateData: any = {};

        // 2. تحديد من يقوم بالحذف وتحديث حالته
        if (booking.clientId.toString() === userId) {
            updateData.statusCustomerDelete = "yes";
        } else if (booking.providerId.toString() === userId) {
            updateData.statusAdminDelete = "yes";
        } else {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // 3. تحديث الحجز في قاعدة البيانات
        const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

        // 4. الحذف النهائي إذا وافق الطرفان
        // 4. الحذف النهائي إذا وافق الطرفان
        if (updatedBooking.statusCustomerDelete === "yes" && updatedBooking.statusAdminDelete === "yes") {
            const serviceId = updatedBooking.serviceId; // حفظ ID الخدمة قبل مسح الحجز

            // مسح الحجز نهائياً
            await Booking.findByIdAndDelete(id);

            // --- السحر هنا ---
            // هل الخدمة دي "محذوفة ناعماً"؟
            const linkedService = await Service.findOne({ _id: serviceId, isDeleted: true });

            if (linkedService) {
                // لو محذوفة ناعماً، نتأكد هل لسه ليها أي حجوزات تانية في الداتا بيز؟
                const remainingBookings = await Booking.findOne({ serviceId: serviceId });

                if (!remainingBookings) {
                    // لو مفيش أي حجوزات تانية خالص مرتبطة بالخدمة دي.. امسحها نهائياً "تنظيف الداتا بيز"
                    await Service.findByIdAndDelete(serviceId);
                }
            }
            // -----------------

            return NextResponse.json({ message: "Booking permanently deleted" });
        }

        return NextResponse.json({ message: "Booking hidden from your view" });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ message: "Error processing request" }, { status: 500 });
    }
}
