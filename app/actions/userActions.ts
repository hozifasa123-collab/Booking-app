"use server";

import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { revalidatePath } from "next/cache";

/** * تحديث بيانات المستخدم
 */
export async function updateUserAction(id: string, formData: { name: string; email: string; phone: string }) {
    try {
        await connectMongoDB();

        const currentUser = await User.findById(id);
        if (!currentUser) return { error: "The user does not exist" };

        // التحقق من تكرار البيانات
        if (formData.name !== currentUser.name && await User.findOne({ name: formData.name })) {
            return { error: "This name is already in use" };
        }
        if (formData.email !== currentUser.email && await User.findOne({ email: formData.email })) {
            return { error: "This email is already in use" };
        }
        if (formData.phone && formData.phone !== currentUser.phone && await User.findOne({ phone: formData.phone })) {
            return { error: "This number is already in use" };
        }

        await User.findByIdAndUpdate(id, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
        });

        revalidatePath("/dashboard/settings"); // تحديث الكاش فوراً
        return { success: true, message: "The profile has been updated successfully" };
    } catch (error) {
        return { error: "An error occurred during the update" };
    }
}

/** * حذف الحساب بالمنطق المعقد (Soft/Hard Delete)
 */
import Review from "@/models/Review";
export async function deleteUserAction(id: string) {
    try {
        await connectMongoDB();

        // 1. جلب جميع خدمات المستخدم
        const userServices = await Service.find({ ownerId: id });

        // 2. معالجة الخدمات بالتوازي باستخدام Promise.all
        await Promise.all(userServices.map(async (service) => {
            // حذف المراجعات المرتبطة بالخدمة
            await Review.deleteMany({ serviceId: service._id });

            // التحقق من وجود حجوزات
            const hasBookings = await Booking.findOne({ serviceId: service._id });

            if (hasBookings) {
                // تحديث الخدمة (حذف ناعم) وإلغاء المواعيد المستقبلية
                return Promise.all([
                    Service.findByIdAndUpdate(service._id, { isDeleted: true }),
                    Booking.updateMany(
                        {
                            serviceId: service._id,
                            status: "confirmed",
                            startTime: { $gt: new Date() }
                        },
                        { $set: { status: "cancelled", statusAdminDelete: "yes" } }
                    )
                ]);
            } else {
                // حذف نهائي للخدمة
                return Service.findByIdAndDelete(service._id);
            }
        }));

        // 3. معالجة حساب المستخدم (User)
        const hasHistory = await Booking.findOne({
            $or: [{ clientId: id }, { providerId: id }]
        });

        if (hasHistory) {
            await User.findByIdAndUpdate(id, { isDeleted: true });
        } else {
            await User.findByIdAndDelete(id);
        }

        // 4. تنظيف نهائي للحجوزات المحذوفة من الطرفين
        await Booking.deleteMany({
            statusCustomerDelete: "yes",
            statusAdminDelete: "yes"
        });

        return { success: true };
    } catch (error) {
        console.error("Delete User Error:", error);
        return { error: "Failed to delete the account" };
    }
}