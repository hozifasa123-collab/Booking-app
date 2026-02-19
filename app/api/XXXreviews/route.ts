import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const { serviceId, rating, comment, bookingId } = await req.json();

        await connectMongoDB();

        // إنشاء التقييم
        const newReview = await Review.create({
            serviceId,
            clientId: userId,
            rating,
            comment
        });

        // تحديث الحجز عشان الزرار يختفي
        await Booking.findByIdAndUpdate(bookingId, { isReviewed: true, statusCustomerDelete: "yes" });

        return NextResponse.json(newReview, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error saving review" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const serviceId = searchParams.get("serviceId");

        // 1. تحقق بسيط بدون استخدام isValidObjectId مؤقتاً للتأكد
        if (!serviceId || serviceId === "undefined" || serviceId.length !== 24) {
            return NextResponse.json({ message: "Invalid or missing Service ID" }, { status: 400 });
        }

        await connectMongoDB();

        // 2. استخدام الموديل مباشرة في الـ populate لضمان الربط
        const reviews = await Review.find({ serviceId: serviceId })
            .populate({
                path: "clientId",
                select: "name image",
                model: User // استخدام الموديل المستورد مباشرة
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(reviews);
    } catch (error: any) {
        console.error("Reviews API Error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}