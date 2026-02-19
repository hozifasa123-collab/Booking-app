"use server";

import connectMongoDB from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";

export async function getReviewsAction(serviceId: string) {
    try {
        if (!serviceId || serviceId.length !== 24) {
            return { success: false, error: "Invalid Service ID" };
        }

        await connectMongoDB();

        const reviews = await Review.find({ serviceId })
            .populate({
                path: "clientId",
                select: "name image",
                model: User
            })
            .sort({ createdAt: -1 });

        // تحويل البيانات لـ Plain Objects لتجنب مشاكل الـ Serialization في Next.js
        const serializedReviews = JSON.parse(JSON.stringify(reviews));

        return { success: true, data: serializedReviews };
    } catch (error: any) {
        console.error("Error fetching reviews:", error);
        return { success: false, error: error.message };
    }
}

import Booking from "@/models/Booking";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createReviewAction(formData: {
  serviceId: string;
  rating: number;
  comment: string;
  bookingId: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const userId = (session.user as any).id;
    const { serviceId, rating, comment, bookingId } = formData;

    await connectMongoDB();

    // إنشاء التقييم
    const newReview = await Review.create({
      serviceId,
      clientId: userId,
      rating,
      comment,
    });

    // تحديث الحجز عشان الزرار يختفي
    await Booking.findByIdAndUpdate(bookingId, { 
      statusCustomerDelete: "yes" 
    });

    return { success: true, data: JSON.parse(JSON.stringify(newReview)) };
  } catch (error: any) {
    console.error("Review Error:", error);
    return { success: false, error: "Error saving review" };
  }
}