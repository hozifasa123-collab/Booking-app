// api/admin/actions

import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // تأكد من المسار حسب مشروعك
import { sendEmail } from "@/lib/mail";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { reactivateTemplate, suspendTemplate, warnTemplate } from "@/lib/emailTemplates";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { userId, action, reason } = await req.json();
        const now = new Date();
        await connectMongoDB();

        // 1. تحديد التحديث المطلوب
        let update: any = {};
        if (action === "warn") update = { $inc: { warnings: 1 } };
        else if (action === "suspend") update = { status: "suspended" };
        else if (action === "activate") update = { status: "active" };

        // 2. تحديث المستخدم أولاً (للحصول على البيانات الدقيقة للإيميل)
        const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
        if (!updatedUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

        const finalReason = reason || "Violation of community guidelines";

        // 3. تنفيذ العمليات الجانبية (Side Effects) بناءً على الأكشن
        if (action === "suspend") {
            await Promise.all([
                Service.updateMany({ ownerId: userId }, { isDeleted: true }),
                // إلغاء كل الحجوزات القادمة سواء كان هو العميل أو المزود
                Booking.updateMany(
                    {
                        $or: [{ clientId: userId }, { providerId: userId }],
                        status: "confirmed",
                        startTime: { $gt: now }
                    },
                    { $set: { status: "cancelled" } }
                ),
                sendEmail(updatedUser.email, "Account Suspended 🚫", suspendTemplate(updatedUser, finalReason))
            ]);
        }
        else if (action === "warn") {
            await Promise.all([
                Notification.create({
                    recipientId: userId,
                    senderId: (session.user as any).id,
                    message: `⚠️ Warning #${updatedUser.warnings}: ${finalReason}`,
                    link: "/dashboard"
                }),
                sendEmail(updatedUser.email, "Official Warning Alert ⚠️", warnTemplate(updatedUser, finalReason))
            ]);
        }
        else if (action === "activate") {
            await Promise.all([
                Service.updateMany({ ownerId: userId }, { isDeleted: false }),
                Notification.create({
                    recipientId: userId,
                    senderId: (session.user as any).id,
                    message: `✅ Your account has been reactivated.`,
                    link: "/dashboard"
                }),
                sendEmail(updatedUser.email, "Account Reactivated ✅", reactivateTemplate(updatedUser))
            ]);
        }

        return NextResponse.json({ message: "Success", user: updatedUser });

    } catch (error: any) {
        console.error("ADMIN_ACTION_ERROR:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}