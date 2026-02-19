// api/services

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

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX X X XXXXXXX X X X X 2. جلب الخدمات (للمستعرضين)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        await connectMongoDB();

        const userId = (session?.user as any)?.id;

        // 1. بناء شرط الفلترة
        let matchQuery: any = { isDeleted: false };
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            matchQuery.ownerId = { $ne: new mongoose.Types.ObjectId(userId) };
        }

        // 2. استخدام Aggregate لجلب الخدمات مع حساب التقييمات
        const services = await Service.aggregate([
            { $match: matchQuery },
            // 1. ربط جدول المراجعات (اللي عملناه قبل كده)
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "serviceId",
                    as: "reviewsData"
                }
            },
            // 2. الربط الجديد: جلب بيانات صاحب الخدمة من جدول الـ users
            {
                $lookup: {
                    from: "users",
                    localField: "ownerId",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $addFields: {
                    averageRating: { $ifNull: [{ $avg: "$reviewsData.rating" }, 0] },
                    totalReviews: { $size: "$reviewsData" },
                    // تحويل مصفوفة ownerDetails إلى Object واحد داخل ownerId
                    ownerId: { $arrayElemAt: ["$ownerDetails", 0] }
                }
            },
            { $project: { reviewsData: 0, ownerDetails: 0 } }, // تنظيف البيانات الزائدة
            { $sort: { createdAt: -1 } }
        ]);

        return NextResponse.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json({ message: "Failed to fetch services" }, { status: 500 });
    }
}
