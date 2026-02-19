"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createBookingAction } from "@/app/actions/bookingActions"; // استيراد الأكشن

export default function BookingModal({
    service,
    isOpen,
    setIsOpen
}: {
    service: any,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void
}) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const generateTimeSlots = (from: string | undefined, to: string | undefined) => {
        if (!from || !to) return [];
        const slots = [];
        const start = parseInt(from.split(":")[0]);
        const end = parseInt(to.split(":")[0]);
        for (let i = start; i < end; i++) {
            const hour24 = `${i.toString().padStart(2, '0')}:00`;
            const period = i >= 12 ? "PM" : "AM";
            const hour12 = i % 12 === 0 ? 12 : i % 12;
            const label12 = `${hour12}:00 ${period}`;
            slots.push({ value: hour24, label: label12 });
        }
        return slots;
    };

    const availableSlots = service ? generateTimeSlots(service.availableFrom, service.availableTo) : [];

    const handleConfirmBooking = async () => {
        if (!date || !time) {
            toast.error("Please select both date and time");
            return;
        }

        const [hours, minutes] = time.split(":").map(Number);
        const startDateTime = new Date(date);
        startDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        if (startDateTime < now) {
            toast.error("This time has already passed. Please select a future time.");
            setTime("");
            return;
        }

        setLoading(true);

        // استخدام السيرفر أكشن بدلاً من fetch
        const result = await createBookingAction({
            serviceId: service._id,
            startTime: startDateTime.toISOString(),
            note: "" // يمكنك إضافة حقل ملاحظات في الـ UI لاحقاً
        });

        if (result.success) {
            toast.success("Booking successful!");
            setIsOpen(false);
            setTime(""); // ريست للوقت
        } else {
            toast.error(result.error || "Booking failed.");
        }

        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-white sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">Book {service?.title}</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center bg-zinc-50 rounded-xl p-2 border border-zinc-100">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today || date.getDay() === 5;
                            }}
                            className="rounded-md"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-500" /> Choose Appointment Time
                        </label>
                        <Select onValueChange={setTime} value={time}>
                            <SelectTrigger className="w-full h-11 bg-white border-zinc-200">
                                <SelectValue placeholder="Click to see available times" />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-[1100]">
                                {availableSlots.map((slot) => (
                                    <SelectItem key={slot.value} value={slot.value} className="focus:bg-emerald-50 cursor-pointer">
                                        {slot.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 flex gap-2">
                    <Button variant="ghost" className="flex-1 h-11" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                    <Button
                        onClick={handleConfirmBooking}
                        disabled={loading || !time || !date}
                        className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
                    >
                        {loading ? "Processing..." : "Confirm Booking"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}