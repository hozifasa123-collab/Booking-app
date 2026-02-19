// api/bookings/[id]/cancel


import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification"; // 1. لا تنسى الاستيراد
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        await connectMongoDB();

        // 1. تحديث الحجز وجلب بيانات العميل والمزود والخدمة
        const updatedBooking = await Booking.findOneAndUpdate(
            {
                _id: id,
                $or: [{ clientId: userId }, { providerId: userId }]
            },
            { status: "cancelled" },
            { new: true }
        )
            .populate("clientId", "name email") // جلب بيانات العميل
            .populate("providerId", "name email") // جلب بيانات المزود
            .populate("serviceId", "title"); // جلب اسم الخدمة

        if (!updatedBooking) {
            return NextResponse.json({ message: "Booking not found or access denied" }, { status: 404 });
        }

        // 2. تحديد من هو "الطرف الآخر" لاستلام الإيميل والإشعار
        const isClient = updatedBooking.clientId._id.toString() === userId;

        const recipient = isClient ? updatedBooking.providerId : updatedBooking.clientId;
        const senderName = session.user.name;
        const dashboardLink = `${process.env.NEXTAUTH_URL}${isClient ? '/dashboard/bookings' : '/dashboard/my-bookings'}`;

        // 3. إنشاء إشعار داخل الموقع
        await Notification.create({
            recipientId: recipient._id,
            senderId: userId,
            message: `${senderName} canceled the booking for the service "${updatedBooking.serviceId.title}"`,
            link: dashboardLink
        });

        // 4. إرسال الإيميل للطرف الآخر
        if (recipient.email) {
            // Email to the other party when someone cancels manually
            await sendEmail(
                recipient.email,
                "Booking Cancellation Alert ⚠️",
                `
    <div style="direction: ltr; font-family: sans-serif; text-align: center; padding: 30px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #dc2626;">Booking Cancelled</h2>
        <p>Hello <b>${recipient.name}</b>, we would like to inform you that <b>${senderName}</b> has cancelled the reservation for <b>${updatedBooking.serviceId.title}</b>.</p>
        <div style="margin-top: 25px;">
            <a href="${process.env.NEXTAUTH_URL}" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
               <span>🔗</span> Go to Dashboard
            </a>
        </div>
    </div>
    `
            );
        }

        return NextResponse.json({ message: "Cancelled and Notification sent" });
    } catch (error) {
        console.error("Error in PATCH booking:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}