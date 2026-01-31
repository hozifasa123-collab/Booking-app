"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Clock, MapPin, DollarSign, Pencil, Trash2, Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import AddServiceModal from "@/components/AddServiceModal";

export default function MyServicesPage() {
    const { data: session } = useSession();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // حقول البحث (Filters)
    const [searchTerm, setSearchTerm] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [maxDuration, setMaxDuration] = useState("");
    const [locationSearch, setLocationSearch] = useState("");

    const fetchMyServices = async () => {
        setLoading(true);
        try {
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

    // منطق التصفية (Filtering Logic)
    const filteredServices = services.filter((service: any) => {
        const matchesTitle = service.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = (service.location || "").toLowerCase().includes(locationSearch.toLowerCase());
        const matchesPrice = maxPrice === "" || service.price <= parseFloat(maxPrice);
        const matchesDuration = maxDuration === "" || service.duration <= parseFloat(maxDuration);

        return matchesTitle && matchesLocation && matchesPrice && matchesDuration;
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
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Services</h1>
                    <p className="text-muted-foreground">Manage the services you offer to clients.</p>
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

            {/* بار البحث المتقدم - بنفس الستايل */}
            <Card className="bg-zinc-50/50 border-dashed shadow-none">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Search Title</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input 
                                    placeholder="Service name..." 
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input 
                                    placeholder="City or area..." 
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Max Price (EGP)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input 
                                    type="number"
                                    placeholder="Budget..." 
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Max Time (Min)</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input 
                                    type="number"
                                    placeholder="Duration..." 
                                    className="pl-8 bg-white h-9 text-sm"
                                    value={maxDuration}
                                    onChange={(e) => setMaxDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredServices.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-zinc-50/30">
                    <CardTitle className="mb-2 text-zinc-400 font-medium">No services found</CardTitle>
                    <CardDescription>Try adjusting your search filters.</CardDescription>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service: any) => (
                        <Card key={service._id} className="group hover:shadow-lg transition-all relative overflow-hidden border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                                    <div className="flex gap-1 transition-opacity">
                                        <Button
                                            className="h-8 w-8 text-sky-600 hover:bg-sky-200"
                                            onClick={() => handleEdit(service)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            className="h-8 w-8 text-red-600 hover:bg-red-100"
                                            onClick={() => handleDelete(service._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm font-medium">
                                <div className="flex items-center text-zinc-600">
                                    <Clock className="mr-2 h-4 w-4 text-sky-500" />
                                    {service.duration} Minutes
                                </div>
                                <div className="flex items-center text-zinc-600">
                                    <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
                                    {service.price} EGP
                                </div>
                                {service.location && (
                                    <div className="flex items-center text-zinc-600">
                                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                                        {service.location}
                                    </div>
                                )}
                                <div className="flex items-center text-zinc-600">
                                    <Clock className="mr-2 h-4 w-4 text-orange-500" />
                                    Hours: {formatTime12(service.availableFrom)} - {formatTime12(service.availableTo)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
