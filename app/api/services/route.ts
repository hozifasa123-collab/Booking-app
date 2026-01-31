import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import Service from "@/models/Service";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 1. إنشاء خدمة جديدة
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // التحقق الصارم من وجود المستخدم
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const {
            title,
            description,
            duration,
            price,
            location,
            availableFrom,
            availableTo
        } = await req.json();

        await connectMongoDB();

        const exists = await Service.findOne({ title });
        if (exists) {
            return NextResponse.json(
                { message: "A service with this title already exists." },
                { status: 400 }
            );
        }

        const newService = await Service.create({
            title,
            description,
            duration,
            price,
            location,
            availableFrom,
            availableTo,
            ownerId: (session.user as any).id, // استخدام as any لتخطي خطأ الـ ID
        });

        return NextResponse.json({ message: "Service created", service: newService }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating service" }, { status: 500 });
    }
}

// 2. جلب الخدمات (للمستعرضين)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        await connectMongoDB();

        const userId = (session?.user as any)?.id;

        // 1. الحالة الافتراضية: هات الخدمات اللي مش ممسوحة ناعماً بس
        let query: any = { isDeleted: false };

        // 2. لو المستخدم مسجل، زود شرط استبعاد خدماته
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query = {
                isDeleted: false,
                ownerId: { $ne: new mongoose.Types.ObjectId(userId) }
            };
        }

        // جلب الخدمات مع إمكانية عمل Populate لبيانات صاحب الخدمة إذا كنت ستحتاج لعرض اسمه
        const services = await Service.find(query)
            .populate("ownerId", "name")
            .sort({ createdAt: -1 });

        return NextResponse.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json({ message: "Failed to fetch services" }, { status: 500 });
    }
}
