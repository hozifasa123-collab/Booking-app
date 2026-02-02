"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
// أضفنا Star و MessageSquare هنا
import { Plus, Clock, MapPin, DollarSign, Pencil, Trash2, Search, FilterX, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import AddServiceModal from "@/components/AddServiceModal";
import { useRouter } from "next/navigation";

export default function MyServicesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // حقول البحث (Filters)
    const [searchTerm, setSearchTerm] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [maxDuration, setMaxDuration] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [minRating, setMinRating] = useState("0"); // حالة جديدة للبحث بالنجوم

    const fetchMyServices = async () => {
        setLoading(true);
        try {
            // الـ API ده لازم يكون بيستخدم Aggregate زي ما شرحنا في الرد السابق
            const res = await fetch("/api/services/my");
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (error) {
            toast.error("Error loading services");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) fetchMyServices();
    }, [session]);

    // منطق التصفية
    const filteredServices = services.filter((service: any) => {
        const matchesTitle = service.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = (service.location || "").toLowerCase().includes(locationSearch.toLowerCase());
        const matchesPrice = maxPrice === "" || service.price <= parseFloat(maxPrice);
        const matchesDuration = maxDuration === "" || service.duration <= parseFloat(maxDuration);
        const serviceRating = service.averageRating || 0;
    const matchesRating = serviceRating >= parseFloat(minRating);

        return matchesTitle && matchesLocation && matchesPrice && matchesDuration && matchesRating;
    });

    const resetFilters = () => {
        setSearchTerm("");
        setMaxPrice("");
        setMaxDuration("");
        setLocationSearch("");
    };

    const handleDelete = async (serviceId: string) => {
        if (!confirm("Are you sure you want to delete this service?")) return;
        try {
            const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Service deleted");
                fetchMyServices();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const [editingService, setEditingService] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEdit = (service: any) => {
        setEditingService(service);
        setIsModalOpen(true);
    }

    const formatTime12 = (time24: string) => {
        if (!time24) return "";
        const [hours] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 === 0 ? 12 : hours % 12;
        return `${hour12}:00 ${period}`;
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Services</h1>
                    <p className="text-muted-foreground">Monitor your performance and manage your offerings.</p>
                </div>
                <div className="flex gap-2">
                    {(searchTerm || maxPrice || maxDuration || locationSearch) && (
                        <Button variant="ghost" onClick={resetFilters} className="text-zinc-500">
                            <FilterX className="h-4 w-4 mr-2" /> Reset
                        </Button>
                    )}
                    <AddServiceModal
                        onServiceAdded={fetchMyServices}
                        editingService={editingService}
                        isOpen={isModalOpen}
                        setIsOpen={(open) => {
                            setIsModalOpen(open);
                            if (!open) setEditingService(null);
                        }}
                    />
                </div>
            </div>

            {/* بار البحث المتقدم */}
            <Card className="bg-zinc-50/50 border-dashed shadow-none">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Search Title</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input placeholder="Service name..." className="pl-8 bg-white h-9 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input placeholder="City or area..." className="pl-8 bg-white h-9 text-sm" value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Max Price</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input type="number" placeholder="Budget..." className="pl-8 bg-white h-9 text-sm" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Max Duration</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input type="number" placeholder="Minutes..." className="pl-8 bg-white h-9 text-sm" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} />
                            </div>
                        </div>
<div className="space-y-2">
    <Label className="text-xs uppercase text-zinc-500 font-bold">Minimum Rating</Label>
    <div className="relative">
        <Star className="absolute left-2.5 top-2.5 h-4 w-4 text-yellow-500" />
        <select 
            className="pl-9 w-full bg-white border border-zinc-200 rounded-md h-10 text-sm"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
        >
            <option value="0">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
        </select>
    </div>
</div>

                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredServices.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-zinc-50/30">
                    <CardTitle className="mb-2 text-zinc-400 font-medium">No services found</CardTitle>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service: any) => (
                        <Card key={service._id} className="group hover:shadow-xl transition-all relative overflow-hidden border-t-4 border-t-zinc-900">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                                        
                                        {/* عرض متوسط النجوم في خدماتي */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center text-yellow-500">
                                                <Star size={14} fill="currentColor" />
                                                <span className="ml-1 text-sm font-bold text-zinc-700">
                                                    {service.averageRating ? Number(service.averageRating).toFixed(1) : "0.0"}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">
                                                {service.totalReviews || 0} REVIEWS
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8 text-sky-600 border-sky-100 hover:bg-sky-50" onClick={() => handleEdit(service)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleDelete(service._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm font-medium">
                                    <div className="flex items-center text-zinc-500">
                                        <Clock className="mr-2 h-4 w-4 text-sky-500" />
                                        {service.duration} Mins • {service.price} EGP
                                    </div>
                                    <div className="flex items-center text-zinc-500">
                                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                                        {service.location || "Remote"}
                                    </div>
                                    <div className="flex items-center text-zinc-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 col-span-2">
    <span className="font-medium">Available: </span>
    <span className="ml-2">
        {formatTime12(service.availableFrom)} — {formatTime12(service.availableTo)}
    </span>
</div>
                                </div>

                                {/* زر الانتقال لصفحة المراجعات */}
                                <Button 
                                    variant="secondary" 
                                    className="w-full gap-2 text-xs font-bold uppercase tracking-wider"
                                    onClick={() => router.push(`/dashboard/services/${service._id}/reviews`)}
                                >
                                    <MessageSquare size={14} /> See Customer Reviews
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}