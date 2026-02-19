"use client";

import { useState } from "react";
import { Clock, MapPin, DollarSign, CalendarCheck, Search, FilterX, User, Star, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BookingModal from "@/components/BookingModal";
import { useRouter } from "next/navigation";

export default function AllServicesClient({ initialServices }: { initialServices: any[] }) {
    const router = useRouter();
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    // حقول البحث
    const [searchTerm, setSearchTerm] = useState("");
    const [provider, setProvider] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [maxDuration, setMaxDuration] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [minRating, setMinRating] = useState("0");

    const filteredServices = initialServices.filter((service: any) => {
        const matchesTitle = service.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOwner = provider === "" || service.ownerId?.name?.toLowerCase().includes(provider.toLowerCase());
        const matchesLocation = service.location?.toLowerCase().includes(locationSearch.toLowerCase());
        const matchesPrice = maxPrice === "" || service.price <= parseFloat(maxPrice);
        const matchesDuration = maxDuration === "" || service.duration <= parseFloat(maxDuration);
        const serviceRating = service.averageRating || 0;
        const matchesRating = serviceRating >= parseFloat(minRating);

        return matchesTitle && matchesOwner && matchesLocation && matchesPrice && matchesDuration && matchesRating;
    });

    const resetFilters = () => {
        setSearchTerm("");
        setMaxPrice("");
        setMaxDuration("");
        setLocationSearch("");
        setProvider("");
        setMinRating("0");
    };

    const handleBookingClick = (service: any) => {
        setSelectedService(service);
        setIsBookingOpen(true);
    };

    const formatTime12 = (time24: string) => {
        if (!time24) return "";
        const [hours] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 === 0 ? 12 : hours % 12;
        return `${hour12}:00 ${period}`;
    };

    return (
        <div className="space-y-6">
            {/* عرض زرار الـ Reset لو فيه فلترة */}
            {filteredServices.length !== initialServices.length && (
                <div className="flex justify-end">
                    <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:text-red-600">
                        <FilterX className="mr-2 h-4 w-4" /> Reset Filters
                    </Button>
                </div>
            )}

            <Card className="bg-zinc-50/50 border-dashed">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Service Name</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input placeholder="Search..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Provider</Label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input placeholder="Name..." className="pl-9 bg-white" value={provider} onChange={(e) => setProvider(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input placeholder="City..." className="pl-9 bg-white" value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Price</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input type="number" placeholder="Max..." className="pl-9 bg-white" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Duration</Label>
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input type="number" placeholder="Min..." className="pl-9 bg-white" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Min Rating</Label>
                            <div className="relative">
                                <Star className="absolute left-2.5 top-2.5 h-4 w-4 text-yellow-500" />
                                <select
                                    className="pl-9 w-full bg-white border border-zinc-200 rounded-md h-10 text-sm"
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                >
                                    <option value="0">All</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="2">2+ Stars</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {filteredServices.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-xl border-2 border-dashed">
                    <p className="text-zinc-500 font-medium">No services match your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service: any) => (
                        <Card key={service._id} className="group hover:shadow-xl transition-all duration-300 border-t-4 border-t-emerald-500 overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl font-bold group-hover:text-emerald-600 transition-colors">{service.title}</CardTitle>
                                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-xs font-bold text-yellow-700 ml-1">
                                            {service.averageRating ? Number(service.averageRating).toFixed(1) : "0.0"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
                                    <User size={14} />
                                    <span>{service.ownerId?.name || "Provider"}</span>
                                    <span className="text-zinc-300 mx-1">•</span>
                                    <span className="text-xs">({service.totalReviews || 0} reviews)</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <CardDescription className="line-clamp-2 h-10">{service.description}</CardDescription>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                        <Clock className="mr-2 h-4 w-4 text-sky-500" />
                                        {service.duration}m
                                    </div>
                                    <div className="flex items-center text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                        <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
                                        {service.price} EGP
                                    </div>
                                    <div className="flex items-center text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100 col-span-2">
                                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                                        {service.location || "Remote / Not set"}
                                    </div>
                                    <div className="flex items-center text-zinc-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 col-span-2">
                                        <CalendarCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                        <span className="font-medium">Available: </span>
                                        <span className="ml-2">
                                            {formatTime12(service.availableFrom)} — {formatTime12(service.availableTo)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-9 gap-2 text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                                    onClick={() => router.push(`/dashboard/services/${service._id}/reviews`)}
                                >
                                    <MessageSquareText size={14} /> View All Reviews
                                </Button>

                                <Button
                                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11"
                                    onClick={() => handleBookingClick(service)}
                                >
                                    <CalendarCheck className="h-4 w-4" /> Book Now
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <BookingModal service={selectedService} isOpen={isBookingOpen} setIsOpen={setIsBookingOpen} />
        </div>
    );
}