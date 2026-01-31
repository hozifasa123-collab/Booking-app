"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddServiceModalProps {
    onServiceAdded: () => void;
    editingService?: any; // الخدمة التي سيتم تعديلها (اختياري)
    isOpen?: boolean;     // للتحكم في فتح المودال خارجياً
    setIsOpen?: (open: boolean) => void;
}

export default function AddServiceModal({
    onServiceAdded,
    editingService,
    isOpen: externalOpen,
    setIsOpen: setExternalOpen
}: AddServiceModalProps) {
    const { data: session } = useSession();
    const [internalOpen, setInternalOpen] = useState(false);

    // مزامنة الحالة بين الفتح الداخلي والخارجي
    const open = externalOpen ?? internalOpen;
    const setOpen = setExternalOpen ?? setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration: "",
        price: "",
        location: "",
        availableFrom: "09:00", // قيمة افتراضية
        availableTo: "17:00",   // قيمة افتراضية
    });

    useEffect(() => {
        if (editingService) {
            setFormData({
                title: editingService.title || "",
                description: editingService.description || "",
                duration: editingService.duration || "",
                price: editingService.price || "",
                location: editingService.location || "",
                availableFrom: editingService.availableFrom || "09:00",
                availableTo: editingService.availableTo || "17:00",
            });
        } else {
            setFormData({
                title: "", description: "", duration: "", price: "",
                location: "", availableFrom: "09:00", availableTo: "17:00"
            });
        }
    }, [editingService, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingService
                ? `/api/services/${editingService._id}` // رابط التعديل
                : "/api/services";                     // رابط الإضافة

            const method = editingService ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, ownerId: (session?.user as any)?.id }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(editingService ? "Service updated!" : "Service added!");
                setOpen(false);
                onServiceAdded();
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!editingService && (
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Service
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="bg-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingService ? "Edit Service" : "Create New Service"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Service Title</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Barbering, Web Design"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your service..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (EGP)</Label>
                            <Input
                                id="price"
                                type="number"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (Min)</Label>
                            <Input
                                id="duration"
                                type="number"
                                required
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Your City or Remote"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="from">Available From</Label>
                            <Input
                                id="from"
                                type="time"
                                value={formData.availableFrom}
                                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">Available To</Label>
                            <Input
                                id="to"
                                type="time"
                                value={formData.availableTo}
                                onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Processing..." : editingService ? "Update Service" : "Create Service"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}