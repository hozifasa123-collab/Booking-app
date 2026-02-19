"use server";

import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";
import { revalidatePath } from "next/cache";

export async function createBookingAction(formData: { serviceId: string, startTime: string, note?: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return { error: "Unauthorized" };
        }

        const clientId = (session.user as any).id;
        const { serviceId, startTime, note } = formData;

        await connectMongoDB();

        const service = await Service.findById(serviceId).populate("ownerId", "name email");
        if (!service) {
            return { error: "Service not found" };
        }

        const start = new Date(startTime);
        const end = new Date(start.getTime() + service.duration * 60000);

        // التأكد من عدم وجود حجز في نفس الوقت
        const existingBooking = await Booking.findOne({
            serviceId,
            status: { $ne: "cancelled" },
            $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
        });

        if (existingBooking) {
            return { error: "This time slot is already booked" };
        }

        const newBooking = await Booking.create({
            serviceId,
            clientId,
            providerId: service.ownerId._id,
            startTime: start,
            endTime: end,
            status: "confirmed"
        });

        const client = await User.findById(clientId);

        // 1. إشعار لمقدم الخدمة
        await Notification.create({
            recipientId: service.ownerId._id,
            senderId: clientId,
            message: `New Booking: ${client.name} has booked the ${service.title} service`,
            link: `/dashboard/bookings`
        });

        // 2. إرسال إيميل
        if (service.ownerId.email) {
            try {
                await sendEmail(
                    service.ownerId.email,
                    "New Booking Received! 💰",
                    `
                    <div style="direction: ltr; font-family: sans-serif; text-align: center; padding: 25px; border: 1px solid #e5e7eb; border-radius: 15px;">
                        <h2 style="color: #10b981;">You have a new booking! ✨</h2>
                        <p><b>${client.name}</b> has booked the service: <b>${service.title}</b>.</p>
                        <p><b>Date & Time:</b> ${start.toLocaleString('en-US')}</p>
                        <div style="margin-top: 20px;">
                            <a href="${process.env.NEXTAUTH_URL}" 
                               style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                               <span>📅</span> Manage Bookings
                            </a>
                        </div>
                    </div>
                    `
                );
            } catch (emailError) {
                console.error("Email sending failed:", emailError);
            }
        }

        revalidatePath("/dashboard/services");
        return { success: true, bookingId: JSON.parse(JSON.stringify(newBooking._id)) };

    } catch (error) {
        console.error("Booking Creation Error:", error);
        return { error: "Internal Server Error" };
    }
}

// 1. جلب الحجوزات
export async function getMyBookingsAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;
        await connectMongoDB();

        const bookings = await Booking.find({
            clientId: userId,
            statusCustomerDelete: "no"
        })
        .populate({
            path: "serviceId",
            populate: { path: "ownerId", select: "name phone email" }
        })
        .sort({ startTime: -1 });

        return { success: true, data: JSON.parse(JSON.stringify(bookings)) };
    } catch (error) {
        return { success: false, error: "Internal Server Error" };
    }
}

// جلب الحجوزات الواردة
export async function getIncomingBookingsAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;
        await connectMongoDB();

        const bookings = await Booking.find({
            providerId: userId,
            statusAdminDelete: "no"
        })
        .populate("serviceId")
        .populate("clientId", "name email phone")
        .sort({ startTime: -1 });

        return { success: true, data: JSON.parse(JSON.stringify(bookings)) };
    } catch (error) {
        return { success: false, error: "Internal Server Error" };
    }
}

// 2. إلغاء الحجز
export async function cancelBookingAction(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;
        await connectMongoDB();

        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: id, $or: [{ clientId: userId }, { providerId: userId }] },
            { status: "cancelled" },
            { new: true }
        )
        .populate("clientId", "name email")
        .populate("providerId", "name email")
        .populate("serviceId", "title");

        if (!updatedBooking) return { success: false, error: "Not found" };

        const isClient = updatedBooking.clientId._id.toString() === userId;
        const recipient = isClient ? updatedBooking.providerId : updatedBooking.clientId;

        await Notification.create({
            recipientId: recipient._id,
            senderId: userId,
            message: `${session.user.name} canceled the booking for "${updatedBooking.serviceId.title}"`,
            link: isClient ? '/dashboard/bookings' : '/dashboard/my-bookings'
        });

        if (recipient.email) {
            await sendEmail(recipient.email, "Booking Cancellation Alert ⚠️", `...`); // نفس محتوى الإيميل
        }

        revalidatePath("/dashboard/my-bookings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to cancel" };
    }
}

// 3. إخفاء أو حذف السجل
export async function deleteBookingAction(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const userId = (session.user as any).id;
        await connectMongoDB();

        const booking = await Booking.findById(id);
        if (!booking) return { success: false, error: "Not found" };

        let updateData: any = {};
        if (booking.clientId.toString() === userId) updateData.statusCustomerDelete = "yes";
        else if (booking.providerId.toString() === userId) updateData.statusAdminDelete = "yes";

        const updated = await Booking.findByIdAndUpdate(id, updateData, { new: true });

        if (updated.statusCustomerDelete === "yes" && updated.statusAdminDelete === "yes") {
            const serviceId = updated.serviceId;
            await Booking.findByIdAndDelete(id);
            const linkedService = await Service.findOne({ _id: serviceId, isDeleted: true });
            if (linkedService) {
                const remaining = await Booking.findOne({ serviceId });
                if (!remaining) await Service.findByIdAndDelete(serviceId);
            }
        }

        revalidatePath("/dashboard/my-bookings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to remove" };
    }
}