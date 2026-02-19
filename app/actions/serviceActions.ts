"use server";

import connectMongoDB from "@/lib/mongodb";
import Service from "@/models/Service";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAllServicesAction() {
    try {
        const session = await getServerSession(authOptions);
        await connectMongoDB();

        const userId = (session?.user as any)?.id;

        let matchQuery: any = { isDeleted: false };
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            matchQuery.ownerId = { $ne: new mongoose.Types.ObjectId(userId) };
        }

        const services = await Service.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "serviceId",
                    as: "reviewsData"
                }
            },
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
                    ownerId: { $arrayElemAt: ["$ownerDetails", 0] }
                }
            },
            { $project: { reviewsData: 0, ownerDetails: 0 } },
            { $sort: { createdAt: -1 } }
        ]);

        // تحويل الـ ObjectIds إلى Strings عشان الـ Client Components
        return JSON.parse(JSON.stringify(services));
    } catch (error) {
        console.error("Error fetching services:", error);
        return [];
    }
}

import Booking from "@/models/Booking";
import { revalidatePath } from "next/cache";

// 1. جلب خدماتي مع الإحصائيات (Aggregate)
export async function getMyServicesAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return { error: "Unauthorized" };

        const userId = (session.user as any).id;
        await connectMongoDB();

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
                    from: "reviews",
                    localField: "_id",
                    foreignField: "serviceId",
                    as: "serviceReviews"
                }
            },
            {
                $addFields: {
                    averageRating: { $ifNull: [{ $avg: "$serviceReviews.rating" }, 0] },
                    totalReviews: { $size: "$serviceReviews" }
                }
            },
            { $project: { serviceReviews: 0 } },
            { $sort: { createdAt: -1 } }
        ]);

        return { success: true, data: JSON.parse(JSON.stringify(myServices)) };
    } catch (error) {
        return { error: "Error fetching your services" };
    }
}

import Review from "@/models/Review";
// 2. حذف خدمة
export async function deleteServiceAction(serviceId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { error: "Unauthorized" };

        await connectMongoDB();

        // فحص هل الخدمة لها حجوزات
        const hasAnyBooking = await Booking.findOne({ serviceId });

        if (hasAnyBooking) {
            // حذف ناعم (إخفاء)
            await Service.findByIdAndUpdate(serviceId, { isDeleted: true });
            await Booking.updateMany(
                { serviceId },
                { $set: { status: 'cancelled', statusAdminDelete: 'yes' } }
            );
        } else {
            // حذف نهائي
            await Service.findByIdAndDelete(serviceId);
        }

        await Review.deleteMany({ serviceId })

        revalidatePath("/dashboard/my-services");
        return { success: true };
    } catch (error) {
        return { error: "Internal Server Error" };
    }
}

import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/mail";

// 1. إنشاء خدمة جديدة
export async function createServiceAction(formData: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return { error: "Unauthorized" };

        await connectMongoDB();

        const exists = await Service.findOne({ title: formData.title });
        if (exists) return { error: "A service with this title already exists." };

        await Service.create({
            ...formData,
            ownerId: (session.user as any).id,
        });

        revalidatePath("/dashboard/my-services");
        return { success: true };
    } catch (error) {
        return { error: "Error creating service" };
    }
}

// 2. تحديث خدمة موجودة مع منطق الإشعارات
export async function updateServiceAction(id: string, data: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { error: "Unauthorized", status: 401 };

        // في Server Actions نصل للبيانات مباشرة من الـ arguments
        const { availableFrom, availableTo, ...otherData } = data;
        const userId = (session.user as any).id;

        await connectMongoDB();

        // 1. تحديث الخدمة
        const updatedService = await Service.findByIdAndUpdate(
            id,
            {
                availableFrom,
                availableTo,
                ...otherData,
            },
            { new: true }
        );

        if (!updatedService) return { error: "Service not found", status: 404 };

        // 2. تحديد الحجوزات المتأثرة بالمواعيد الجديدة
        const startHour = parseInt(availableFrom.split(":")[0]);
        const endHour = parseInt(availableTo.split(":")[0]);

        const affectedBookings = await Booking.find({
            serviceId: id,
            status: "confirmed",
            startTime: { $gt: new Date() },
            $expr: {
                $or: [
                    { $lt: [{ $hour: "$startTime" }, startHour] },
                    { $gte: [{ $hour: "$startTime" }, endHour] },
                ],
            },
        }).populate("clientId", "email name");

        // 3. إلغاء الحجوزات المتأثرة
        if (affectedBookings.length > 0) {
            await Booking.updateMany(
                { _id: { $in: affectedBookings.map((b) => b._id) } },
                {
                    $set: {
                        status: "cancelled",
                    },
                }
            );

            // 4. إرسال إشعارات الإلغاء
            const cancellationPromises = affectedBookings.flatMap((booking) => {
                const clientEmail = (booking.clientId as any)?.email;
                const clientName = (booking.clientId as any)?.name || "Customer";

                const tasks = [
                    Notification.create({
                        recipientId: booking.clientId._id.toString(),
                        senderId: userId,
                        message: `Unfortunately, your booking for "${updatedService.title}" has been canceled due to schedule changes.`,
                        link: `/dashboard/my-bookings`,
                    }),
                ];

                if (clientEmail) {
                    tasks.push(
                        sendEmail(
                            clientEmail,
                            "Booking Cancellation Notice ⚠️",
                            `
                            <div style="direction: ltr; font-family: sans-serif; text-align: center; padding: 25px; border: 1px solid #fecaca; border-radius: 15px; background-color: #fffafb;">
                              <h2 style="color: #dc2626; margin-bottom: 10px;">Booking Cancelled</h2>
                              <p style="color: #4b5563;">Hello <b>${clientName}</b>, your booking for <b>${updatedService.title}</b> was cancelled due to updated working hours.</p>
                              <div style="margin-top: 25px;">
                                <a href="${process.env.NEXTAUTH_URL}" 
                                   style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                                   <span>📅</span> Re-book Now
                                </a>
                              </div>
                            </div>
                            `
                        )
                    );
                }
                return tasks;
            });

            await Promise.all(cancellationPromises);
        }

        // 5. إشعارات للحجوزات القائمة (تنبيه فقط)
        const pendingBookings = await Booking.find({
            serviceId: id,
            status: "confirmed",
            startTime: { $gt: new Date() },
        }).populate("clientId", "email name");

        const pendingPromises = pendingBookings.flatMap((booking) => {
            const clientEmail = (booking.clientId as any)?.email;
            const clientName = (booking.clientId as any)?.name || "Customer";

            const tasks = [
                Notification.create({
                    recipientId: booking.clientId._id.toString(),
                    senderId: userId,
                    message: `The schedule for the service "${updatedService.title}" has been updated. Please check your booking details.`,
                    link: `/dashboard/my-bookings`,
                }),
            ];

            if (clientEmail) {
                tasks.push(
                    sendEmail(
                        clientEmail,
                        "Service Schedule Updated ℹ️",
                        `
                        <div style="direction: ltr; font-family: sans-serif; text-align: center; padding: 25px; border: 1px solid #e5e7eb; border-radius: 15px; background-color: #f9fafb;">
                          <h2 style="color: #2563eb; margin-bottom: 10px;">Schedule Updated</h2>
                          <p>Hello <b>${clientName}</b>, the provider of <b>${updatedService.title}</b> has updated their working hours.</p>
                          <p style="color: #6b7280;">Your booking is still confirmed, but we recommend checking the new schedule.</p>
                          <div style="margin-top: 25px;">
                            <a href="${process.env.NEXTAUTH_URL}" 
                               style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                               <span>👁️</span> Review Booking
                            </a>
                          </div>
                        </div>
                        `
                    )
                );
            }
            return tasks;
        });

        await Promise.all(pendingPromises);

        // تحديث الكاش لضمان ظهور البيانات الجديدة في السيرفر كومبوننت
        revalidatePath("/dashboard/my-services");

        return {
            success: true,
            message: "Service updated and all notifications sent",
            cancelledCount: affectedBookings.length,
        };
    } catch (error: any) {
        console.error("Update Error:", error);
        return { error: error.message || "Update failed", status: 500 };
    }
}