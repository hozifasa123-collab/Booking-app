// api/admin/all-data

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Service from "@/models/Service";
import Review from "@/models/Review";

export async function GET() {
    try {
        await connectDB();

        const [rawUsers, rawServices, rawReviews] = await Promise.all([
            // 1. Fetch Users: Exclude admins
            User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).lean(),

            // 2. Fetch Services: Populate owner but filter by role
            Service.find()
                .populate({
                    path: "ownerId",
                    match: { role: { $ne: "admin" } }
                })
                .sort({ createdAt: -1 })
                .lean(),

            // 3. Fetch Reviews: Populate author and service owner
            Review.find()
                .populate({
                    path: "clientId",
                    match: { role: { $ne: "admin" } }
                })
                .populate({
                    path: "serviceId",
                    populate: {
                        path: "ownerId",
                        match: { role: { $ne: "admin" } }
                    }
                })
                .sort({ createdAt: -1 })
                .lean()
        ]);

        // 🔥 CRITICAL STEP: Manual filtering to remove null objects (Admin traces)

        // Remove services owned by admins
        const filteredServices = rawServices.filter((s: any) => s.ownerId !== null);

        // Remove reviews written by admins OR written on services owned by admins
        const filteredReviews = rawReviews.filter((r: any) =>
            r.clientId !== null &&
            r.serviceId !== null &&
            r.serviceId.ownerId !== null
        );

        const stats = {
            totalUsers: rawUsers.length,
            totalServices: filteredServices.length,
            totalReviews: filteredReviews.length,
        };

        return NextResponse.json({
            stats,
            users: rawUsers,
            services: filteredServices,
            reviews: filteredReviews
        });

    } catch (error: any) {
        console.error("ADMIN_DATA_FETCH_ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}