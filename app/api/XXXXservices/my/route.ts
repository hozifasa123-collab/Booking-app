// /api/services/my

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import Service from "@/models/Service";
import Review from "@/models/Review"; // تأكد من استيراد الموديل
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        await connectMongoDB();

        // تحويل الـ userId إلى ObjectId ليقبل العمل في الـ Aggregate
        const ownerObjectId = new mongoose.Types.ObjectId(userId);

        const myServices = await Service.aggregate([
            {
                $match: {
                    ownerId: ownerObjectId,
                    isDeleted: false
                }
            },
            {
                $lookup: {
                    from: "reviews", // يجب أن يكون نفس اسم الكولكشن في قاعدة البيانات
                    localField: "_id",
                    foreignField: "serviceId",
                    as: "serviceReviews"
                }
            },
            {
                $addFields: {
                    averageRating: {
                        $ifNull: [{ $avg: "$serviceReviews.rating" }, 0]
                    },
                    totalReviews: {
                        $size: "$serviceReviews"
                    }
                }
            },
            { $project: { serviceReviews: 0 } }, // إزالة المراجعات التفصيلية لتقليل حجم الـ JSON
            { $sort: { createdAt: -1 } }
        ]);

        return NextResponse.json(myServices);
    } catch (error) {
        console.error("Fetch my services error:", error);
        return NextResponse.json({ message: "Error fetching your services" }, { status: 500 });
    }
}