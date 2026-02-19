// api/bookings

import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const clientId = (session.user as any).id;
        const { serviceId, startTime, note } = await req.json();
        await connectMongoDB();

        const service = await Service.findById(serviceId).populate("ownerId", "name email");
        if (!service) {
            return NextResponse.json({ message: "Service not found" }, { status: 404 });
        }

        const start = new Date(startTime);
        const end = new Date(start.getTime() + service.duration * 60000);

        const existingBooking = await Booking.findOne({
            serviceId,
            status: { $ne: "cancelled" },
            $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
        });

        if (existingBooking) {
            return NextResponse.json({ message: "This time slot is already booked" }, { status: 409 });
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

        // 1. إشعار وإيميل لمقدم الخدمة (Provider)
        await Notification.create({
            recipientId: service.ownerId._id,
            senderId: clientId,
            message: `New Booking: ${client.name} has booked the ${service.title} service`,
            link: `/dashboard/bookings`
        });

        if (service.ownerId.email) {
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
        }

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        console.error("Booking Creation Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}