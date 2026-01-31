"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Clock, XCircle, CheckCircle2, CalendarDays, Users, Loader2 } from "lucide-react";

export default function DashboardStats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard")
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    const cards = [
        { title: "Total Services", value: stats.totalServices, icon: LayoutGrid, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Total Bookings", value: stats.totalBookings, icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Pending Bookings", value: stats.pendingBookings, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Cancelled Bookings", value: stats.cancelledBookings, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        { title: "Completed Bookings", value: stats.completedBookings, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Unique Clients", value: stats.uniqueClientsCount, icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
            {cards.map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}