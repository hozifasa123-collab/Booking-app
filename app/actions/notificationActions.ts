"use server";

import connectMongoDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 1. جلب الإشعارات والعدد غير المقروء
export async function getNotificationsAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;
        await connectMongoDB();

        const notifications = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(10);

        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });

        return { 
            success: true, 
            notifications: JSON.parse(JSON.stringify(notifications)), 
            unreadCount 
        };
    } catch (error) {
        return { success: false, error: "Error fetching notifications" };
    }
}

// 2. تحديث الإشعارات كـ "مقروءة"
export async function markAsReadAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false };

        const userId = (session.user as any).id;
        await connectMongoDB();

        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        revalidatePath("/"); // تحديث الكاش في السيرفر
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// 3. حذف إشعار معين
export async function deleteNotificationAction(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false };

        await connectMongoDB();
        await Notification.findByIdAndDelete(id);

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}