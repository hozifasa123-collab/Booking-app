import connectMongoDB from "@/lib/mongodb";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { availableFrom, availableTo, ...otherData } = await req.json();
    const userId = (session.user as any).id;

    await connectMongoDB();

    // 1. تحديث الخدمة
    const updatedService = await Service.findByIdAndUpdate(id, {
      availableFrom,
      availableTo,
      ...otherData
    }, { new: true });

    if (!updatedService) return NextResponse.json({ message: "Service not found" }, { status: 404 });

    // 2. تحديد الحجوزات المتأثرة بالمواعيد الجديدة (مع جلب بيانات العميل)
    const startHour = parseInt(availableFrom.split(":")[0]);
    const endHour = parseInt(availableTo.split(":")[0]);

    const affectedBookings = await Booking.find({
      serviceId: id,
      status: "confirmed",
      startTime: { $gt: new Date() },
      $expr: {
        $or: [
          { $lt: [{ $hour: "$startTime" }, startHour] },
          { $gte: [{ $hour: "$startTime" }, endHour] }
        ]
      }
    }).populate("clientId", "email name"); // جلب الإيميل والاسم

    // 3. إلغاء الحجوزات في الداتا بيز
    if (affectedBookings.length > 0) {
      await Booking.updateMany(
        { _id: { $in: affectedBookings.map(b => b._id) } },
        {
          $set: {
            status: "cancelled",
            cancelReason: "قام مقدم الخدمة بتغيير ساعات العمل"
          }
        }
      );

      // 4. إرسال إشعارات السيستم + إيميلات للإلغاء
      const cancellationPromises = affectedBookings.flatMap(booking => {
        const clientEmail = (booking.clientId as any)?.email;
        const clientName = (booking.clientId as any)?.name || "Customer";

        const tasks = [
          Notification.create({
            recipientId: booking.clientId._id.toString(),
            senderId: userId,
            message: `Unfortunately, your booking for "${updatedService.title}" has been canceled due to schedule changes.`,
            link: `/dashboard/my-bookings`,
          })
        ];

        if (clientEmail) {
          tasks.push(sendEmail(
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
          ));
        }
        return tasks;
      });

      await Promise.all(cancellationPromises);
    }

    // 5. إشعارات للحجوزات التي ما زالت قائمة (تنبيه بتغيير المواعيد)
    const pendingBookings = await Booking.find({
      serviceId: id,
      status: "confirmed",
      startTime: { $gt: new Date() }
    }).populate("clientId", "email name");

    const pendingPromises = pendingBookings.flatMap(booking => {
      const clientEmail = (booking.clientId as any)?.email;
      const clientName = (booking.clientId as any)?.name || "Customer";

      const tasks = [
        Notification.create({
          recipientId: booking.clientId._id.toString(),
          senderId: userId,
          message: `The schedule for the service "${updatedService.title}" has been updated. Please check your booking details.`,
          link: `/dashboard/my-bookings`,
        })
      ];

      if (clientEmail) {
        tasks.push(sendEmail(
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
        ));
      }
      return tasks;
    });

    await Promise.all(pendingPromises);

    return NextResponse.json({
      message: "Service updated and all notifications (System & Email) sent",
      cancelledCount: affectedBookings.length
    });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: error.message || "Update failed" }, { status: 500 });
  }
}

// التعديل هنا: إضافة Promise لتجنب خطأ TypeScript في Vercel
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongoDB();

    // 1. هل الخدمة مرتبطة بأي حجز (مهما كانت حالته)؟
    const hasAnyBooking = await Booking.findOne({ serviceId: id });

    if (hasAnyBooking) {
      // أ- الحل "الناعم": لو لها حجوزات، نكتفي بإخفائها عن الجمهور
      await Service.findByIdAndUpdate(id, { isDeleted: true });

      // تحديث الحجوزات المرتبطة لتصبح ملغية ومخفية عن صاحب الخدمة
      await Booking.updateMany(
        { serviceId: id },
        { $set: { status: 'cancelled', statusAdminDelete: 'yes' } }
      );

      return NextResponse.json({
        message: "Service deleted"
      });
    } else {
      // ب- الحل "الجذري": لو مفيش أي حجز، نمسحها تماماً من الوجود
      await Service.findByIdAndDelete(id);
      return NextResponse.json({ message: "Service deleted" });
    }

  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
