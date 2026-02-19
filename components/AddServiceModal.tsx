"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import { createServiceAction, updateServiceAction } from "@/app/actions/serviceActions";

interface AddServiceModalProps {
    onServiceAdded: () => void;
    editingService?: any;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function AddServiceModal({
    onServiceAdded,
    editingService,
    isOpen: externalOpen,
    setIsOpen: setExternalOpen
}: AddServiceModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen ?? internalOpen;
    const setOpen = setExternalOpen ?? setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration: "",
        price: "",
        location: "",
        availableFrom: "09:00",
        availableTo: "17:00",
    });

    useEffect(() => {
        if (editingService) {
            setFormData({
                title: editingService.title || "",
                description: editingService.description || "",
                duration: editingService.duration?.toString() || "",
                price: editingService.price?.toString() || "",
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

        const result = editingService
            ? await updateServiceAction(editingService._id, formData)
            : await createServiceAction(formData);

        if (result.success) {
            toast.success(editingService ? "Service updated!" : "Service added!");
            setOpen(false);
            onServiceAdded(); // ستنادي router.refresh() في الصفحة الأب
        } else {
            toast.error(result.error || "Something went wrong");
        }
        setLoading(false);
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