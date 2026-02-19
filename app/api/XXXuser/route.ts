//  api/user

import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Service from "@/models/Service";
import Booking from "@/models/Booking";

export async function PUT(req: NextRequest) {
  try {
    await connectMongoDB();

    // 1. التأكد من هوية المستخدم من السيشين (أمان إضافي)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get('id');
    const { name, email, phone } = await req.json();

    // 2. التأكد من وجود المستخدم
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 3. التحقق من تكرار الإيميل فقط لو الإيميل اتغير
    if (email && email !== currentUser.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return NextResponse.json(
          { message: "This email is already taken" },
          { status: 400 }
        );
      }
    }

    if (name && name !== currentUser.name) {
      const nameExists = await User.findOne({ name });
      if (nameExists) {
        return NextResponse.json(
          { message: "This name is already taken" },
          { status: 401 }
        );
      }
    }

    if (phone && phone !== currentUser.phone && phone !== '') {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return NextResponse.json(
          { message: "This phone is already taken" },
          { status: 402 }
        );
      }
    }

    // 4. التحديث
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true }
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      user: { name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone }
    }, { status: 200 });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

// دالة الـ GET لجلب بيانات المستخدم
export async function GET(req: NextRequest) {
  try {
    await connectMongoDB();
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).select("-password"); // لا ترجع الباسورد أبداً
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectMongoDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    const userId = (session.user as any).id;

    if (userId !== id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. جلب كل خدمات المستخدم أولاً
    const userServices = await Service.find({ ownerId: id });

    // 2. معالجة كل خدمة على حدة
    for (const service of userServices) {
      const hasBookings = await Booking.findOne({ serviceId: service._id });

      if (hasBookings) {
        // الخدمة اللي عندها حجوزات: نكتفي بإخفائها (Soft Delete)
        await Service.findByIdAndUpdate(service._id, { isDeleted: true });
        
        const now = new Date();
        // إلغاء الحجوزات المستقبلية المرتبطة بها
        await Booking.updateMany(
          { serviceId: service._id, status: "confirmed", startTime: { $gt: now } },
          { $set: { status: "cancelled", statusAdminDelete: "yes" } }
        );
      } else {
        // الخدمة اللي معندهاش أي حجوزات: نمسحها تماماً من الداتا بيز
        await Service.findByIdAndDelete(service._id);
      }
    }

    // 3. بعد تنظيف الخدمات، نقرر حالة المستخدم نفسه
    const hasUserHistory = await Booking.findOne({
      $or: [{ clientId: id }, { providerId: id }]
    });

    if (hasUserHistory) {
      await User.findByIdAndUpdate(id, { isDeleted: true });
    } else {
      await User.findByIdAndDelete(id);
    }

    await Booking.deleteMany({
      statusCustomerDelete: "yes",
      statusAdminDelete: "yes"
    });

    return NextResponse.json({
      message: "The account has been deactivated and the reservations have been successfully processed."
    }, { status: 200 });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "An error occurred while deleting" }, { status: 500 });
  }
}
