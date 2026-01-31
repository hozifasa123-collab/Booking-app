"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, DollarSign, CalendarCheck, Search, FilterX,User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import BookingModal from "@/components/BookingModal";

export default function AllServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    // حقول البحث
    const [searchTerm, setSearchTerm] = useState("");
    const [provider, setProvider] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [maxDuration, setMaxDuration] = useState("");
    const [locationSearch, setLocationSearch] = useState("");

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch("/api/services");
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
        fetchServices();
    }, []);

    // دالة التصفية الذكية
    const filteredServices = services.filter((service: any) => {
        const matchesTitle = service.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOwner = service.ownerId?.name?.toLowerCase().includes(provider.toLowerCase())
        const matchesLocation = service.location?.toLowerCase().includes(locationSearch.toLowerCase());
        const matchesPrice = maxPrice === "" || service.price <= parseFloat(maxPrice);
        const matchesDuration = maxDuration === "" || service.duration <= parseFloat(maxDuration);

        return matchesTitle && matchesOwner && matchesLocation && matchesPrice && matchesDuration;
    });

    const resetFilters = () => {
        setSearchTerm("");
        setMaxPrice("");
        setMaxDuration("");
        setLocationSearch("");
    };

    const handleBookingClick = (service: any) => {
        setSelectedService(service);
        setIsBookingOpen(true);
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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available Services</h1>
                    <p className="text-muted-foreground">Find the perfect service based on your needs.</p>
                </div>
                {filteredServices.length !== services.length && (
                    <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:text-red-600">
                        <FilterX className="mr-2 h-4 w-4" /> Reset Filters
                    </Button>
                )}
            </header>

            {/* بار البحث المتقدم */}
            <Card className="bg-zinc-50/50 border-dashed">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Service Name</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input 
                                    placeholder="Search title..." 
                                    className="pl-9 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Provider Name</Label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input 
                                    placeholder="Search provider name..." 
                                    className="pl-9 bg-white"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input 
                                    placeholder="City or area..." 
                                    className="pl-9 bg-white"
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Max Price (EGP)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input 
                                    type="number"
                                    placeholder="Up to..." 
                                    className="pl-9 bg-white"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Max Duration (Min)</Label>
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input 
                                    type="number"
                                    placeholder="Minutes..." 
                                    className="pl-9 bg-white"
                                    value={maxDuration}
                                    onChange={(e) => setMaxDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-20">
                    <p className="animate-pulse text-zinc-400">Loading amazing services...</p>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-xl border-2 border-dashed">
                    <p className="text-zinc-500 font-medium">No services match your search criteria.</p>
                    <Button variant="link" onClick={resetFilters}>Clear all filters</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service: any) => (
                        <Card key={service._id} className="group hover:shadow-xl transition-all duration-300 border-t-4 border-t-emerald-500">
                            <CardHeader>
                                <CardTitle className="text-2xl group-hover:text-emerald-600 transition-colors">{service.title}</CardTitle>
                                <CardTitle className="text-lg transition-colors">
                                    Provider: <span className="text-sm text-zinc-600 font-medium">{service.ownerId?.name}</span>
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">{service.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                                    <div className="flex items-center text-zinc-600 bg-zinc-50 p-2 rounded-md">
                                        <Clock className="mr-2 h-4 w-4 text-sky-500" />
                                        {service.duration}m
                                    </div>
                                    <div className="flex items-center text-zinc-600 bg-zinc-50 p-2 rounded-md">
                                        <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
                                        {service.price} EGP
                                    </div>
                                    <div className="flex items-center text-zinc-600 bg-zinc-50 p-2 rounded-md col-span-2">
                                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                                        {service.location || "Remote / Not set"}
                                    </div>
                                </div>
                                
                                <div className="text-xs font-bold text-zinc-400 flex items-center justify-center py-1 border-y border-zinc-100">
                                    AVAILABLE: {formatTime12(service.availableFrom)} - {formatTime12(service.availableTo)}
                                </div>

                                <Button
                                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-emerald-200 transition-all"
                                    onClick={() => handleBookingClick(service)}
                                >
                                    <CalendarCheck className="h-4 w-4" /> Book Appointment
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <BookingModal
                service={selectedService}
                isOpen={isBookingOpen}
                setIsOpen={setIsBookingOpen}
            />
        </div>
    );
}
