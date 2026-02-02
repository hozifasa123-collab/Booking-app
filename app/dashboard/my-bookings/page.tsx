"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Loader2, CalendarDays, Clock, User, Phone, Mail,
    XCircle, Trash2, FilterX, Briefcase, AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReviewForm from "@/components/ReviewForm"; // استيراد المكون الجديد

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [serviceSearch, setServiceSearch] = useState("");
    const [providerNameSearch, setProviderNameSearch] = useState("");
    const [providerEmailSearch, setProviderEmailSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchMyBookings = async () => {
        try {
            const res = await fetch("/api/bookings/my");
            const data = await res.json();
            if (Array.isArray(data)) setBookings(data);
        } catch (error) {
            toast.error("Error loading your bookings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyBookings(); }, []);

    const filteredBookings = bookings.filter((booking) => {
        const matchesService = booking.serviceId?.title?.toLowerCase().includes(serviceSearch.toLowerCase());
        const matchesProviderName = booking.serviceId?.ownerId?.name?.toLowerCase().includes(providerNameSearch.toLowerCase());
        const matchesProviderEmail = booking.serviceId?.ownerId?.email?.toLowerCase().includes(providerEmailSearch.toLowerCase());

        const bookingDate = new Date(booking.startTime);
        const expired = isPast(bookingDate);
        let currentStatus = booking.status;
        if (currentStatus === "confirmed" && expired) currentStatus = "completed";

        const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;

        return matchesService && matchesProviderName && matchesProviderEmail && matchesStatus;
    });

    const resetFilters = () => {
        setServiceSearch("");
        setProviderNameSearch("");
        setProviderEmailSearch("");
        setStatusFilter("all");
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel?")) return;
        try {
            const res = await fetch(`/api/bookings/${id}/cancel`, { method: "PATCH" });
            if (res.ok) {
                toast.success("Cancelled successfully");
                fetchMyBookings();
            }
        } catch (error) { toast.error("Failed to cancel"); }
    };

    const handleDelete = async (id: any) => {
        if (!confirm("Are you sure you want to remove this record?")) return;
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: "PATCH" });
            if (res.ok) {
                toast.success("Removed from your view");
                fetchMyBookings();
            }
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Bookings</h1>
                    <p className="text-muted-foreground">Track and manage your service appointments.</p>
                </header>
                {(serviceSearch || providerNameSearch || providerEmailSearch || statusFilter !== "all") && (
                    <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:bg-red-50">
                        <FilterX className="h-4 w-4 mr-2" /> Reset Filters
                    </Button>
                )}
            </div>

            {/* الفلاتر */}
            <Card className="bg-zinc-50/50 border-dashed shadow-none border-2">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Service Title</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input
                                    placeholder="Search service..."
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* ... بقية حقول البحث كما هي ... */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Provider Name</Label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input
                                    placeholder="Search provider..."
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={providerNameSearch}
                                    onChange={(e) => setProviderNameSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Provider Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input
                                    placeholder="Search email..."
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={providerEmailSearch}
                                    onChange={(e) => setProviderEmailSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-white h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                    <p className="text-muted-foreground font-medium">No bookings found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBookings.map((booking: any) => {
                        const bookingDate = new Date(booking.startTime);
                        const expired = isPast(bookingDate);
                        const isCancelled = booking.status === "cancelled";
                        const isBookingToday = isToday(bookingDate);

                        return (
                            <Card key={booking._id} className={`group transition-all border-l-4 ${isCancelled ? 'border-l-red-400' : expired ? 'border-l-emerald-500' : 'border-l-sky-500'}`}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-zinc-800">{booking.serviceId?.title}</h3>
                                                {isBookingToday && !isCancelled && !expired && (
                                                    <Badge className="bg-orange-50 text-orange-600 animate-pulse">Today</Badge>
                                                )}
                                                {booking.isReviewed && (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-100 bg-emerald-50">Reviewed ✅</Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-zinc-600"><CalendarDays className="h-4 w-4 text-emerald-500" /> {format(bookingDate, "PPP")}</div>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-600"><Clock className="h-4 w-4 text-sky-500" /> {format(bookingDate, "p")}</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-800"><User className="h-4 w-4 text-zinc-400" /> {booking.serviceId?.ownerId?.name}</div>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-600"><Mail className="h-4 w-4 text-zinc-400" /> {booking.serviceId?.ownerId?.email}</div>
                                                </div>
                                            </div>

                                            {/* نظام التقييم يظهر هنا بعد اكتمال الخدمة */}
                                            {expired && !isCancelled && !booking.isReviewed && (
                                                <div className="mt-4 pt-4 border-t border-dashed">
                                                    <ReviewForm 
                                                        serviceId={booking.serviceId?._id} 
                                                        bookingId={booking._id} 
                                                        onSuccess={fetchMyBookings} 
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end justify-between min-w-[150px]">
                                            <Badge className="font-bold uppercase text-[10px] tracking-widest px-3" variant={isCancelled ? "destructive" : expired ? "default" : "secondary"}>
                                                {isCancelled ? "Cancelled" : expired ? "Completed" : "Confirmed"}
                                            </Badge>

                                            <div className="flex flex-col gap-2 w-full mt-4">
                                                {!isCancelled && !expired && (
                                                    <Button variant="outline" size="sm" onClick={() => handleCancel(booking._id)} className="text-red-500 border-red-100 hover:bg-red-50 h-9 w-full">
                                                        <XCircle className="h-4 w-4 mr-2" /> Cancel Booking
                                                    </Button>
                                                )}
                                                {(isCancelled || expired) && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(booking._id)} className="text-zinc-400 hover:text-red-600 h-9 w-full">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Remove Record
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}