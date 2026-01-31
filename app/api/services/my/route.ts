import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // التحقق الآمن من الجلسة والمستخدم
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // استخدام as any لإخبار TypeScript أن الحقل id موجود فعلياً
        const userId = (session.user as any).id;

        await connectMongoDB();

        // استخدام userId الذي استخرجناه بدلاً من الوصول المباشر لـ session.user.id
        const myServices = await Service.find({ ownerId: userId, isDeleted: false }).sort({ createdAt: -1 });

        return NextResponse.json(myServices);
    } catch (error) {
        console.error("Fetch services error:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}