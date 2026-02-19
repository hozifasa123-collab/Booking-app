// api/notifications

import connectMongoDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        await connectMongoDB();

        // جلب آخر 10 إشعارات للمستخدم الحالي
        const notifications = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(10);

        // حساب عدد الإشعارات غير المقروءة
        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching notifications" }, { status: 500 });
    }
}

export async function PUT() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        await connectMongoDB();

        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ message: "All notifications marked as read" });
    } catch (error) {
        return NextResponse.json({ status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // 1. استخراج الـ id من الـ URL
        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get("id");

        if (!notificationId) {
            return NextResponse.json({ message: "Notification ID is required" }, { status: 400 });
        }

        await connectMongoDB();

        // 2. الحذف باستخدام الـ ID الخاص بالإشعار فقط
        const deletedNotification = await Notification.findByIdAndDelete(notificationId);

        if (!deletedNotification) {
            return NextResponse.json({ message: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ message: "Error deleting notification" }, { status: 500 });
    }
}