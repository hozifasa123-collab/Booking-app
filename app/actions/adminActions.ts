"use server";

import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import Service from "@/models/Service";
import Review from "@/models/Review";
import Notification from "@/models/Notification";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";
import { reactivateTemplate, suspendTemplate, warnTemplate } from "@/lib/emailTemplates";
import { revalidatePath } from "next/cache";

// التحقق من صلاحية الأدمن
async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }
    return session;
}

// 1. جلب كل بيانات لوحة التحكم
export async function getAllAdminDataAction() {
    try {
        await verifyAdmin();
        await connectMongoDB();

        const [rawUsers, rawServices, rawReviews] = await Promise.all([
            User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).lean(),
            Service.find().populate({ path: "ownerId", match: { role: { $ne: "admin" } } }).sort({ createdAt: -1 }).lean(),
            Review.find()
                .populate({ path: "clientId", match: { role: { $ne: "admin" } } })
                .populate({ path: "serviceId", populate: { path: "ownerId", match: { role: { $ne: "admin" } } } })
                .sort({ createdAt: -1 }).lean()
        ]);

        const filteredServices = rawServices.filter((s: any) => s.ownerId !== null);
        const filteredReviews = rawReviews.filter((r: any) => 
            r.clientId !== null && r.serviceId !== null && r.serviceId.ownerId !== null
        );

        return {
            success: true,
            users: JSON.parse(JSON.stringify(rawUsers)),
            services: JSON.parse(JSON.stringify(filteredServices)),
            reviews: JSON.parse(JSON.stringify(filteredReviews)),
            stats: {
                totalUsers: rawUsers.length,
                totalServices: filteredServices.length,
                totalReviews: filteredReviews.length,
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 2. تنفيذ إجراء على مستخدم (تحذير، إيقاف، تفعيل)
export async function executeUserAction(userId: string, action: string, reason?: string) {
    try {
        const session = await verifyAdmin();
        const now = new Date();
        await connectMongoDB();

        let update: any = {};
        if (action === "warn") update = { $inc: { warnings: 1 } };
        else if (action === "suspend") update = { status: "suspended" };
        else if (action === "activate") update = { status: "active" };

        const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
        if (!updatedUser) throw new Error("User not found");

        const finalReason = reason || "Violation of community guidelines";

        if (action === "suspend") {
            await Promise.all([
                Service.updateMany({ ownerId: userId }, { isDeleted: true }),
                Booking.updateMany(
                    { $or: [{ clientId: userId }, { providerId: userId }], status: "confirmed", startTime: { $gt: now } },
                    { $set: { status: "cancelled" } }
                ),
                sendEmail(updatedUser.email, "Account Suspended 🚫", suspendTemplate(updatedUser, finalReason))
            ]);
        } else if (action === "warn") {
            await Promise.all([
                Notification.create({
                    recipientId: userId,
                    senderId: (session.user as any).id,
                    message: `⚠️ Warning #${updatedUser.warnings}: ${finalReason}`,
                    link: "/dashboard"
                }),
                sendEmail(updatedUser.email, "Official Warning Alert ⚠️", warnTemplate(updatedUser, finalReason))
            ]);
        } else if (action === "activate") {
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

        revalidatePath("/admin");
        return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}