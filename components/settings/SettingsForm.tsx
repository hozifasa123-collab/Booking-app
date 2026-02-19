"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { updateUserAction, deleteUserAction } from "@/app/actions/userActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Save, X } from "lucide-react";

export default function SettingsForm({ user }: { user: any }) {
    const { data: session, update } = useSession();
    const [formData, setFormData] = useState({ name: user.name, email: user.email, phone: user.phone });
    const [loading, setLoading] = useState(false);

    const hasChanges = JSON.stringify(formData) !== JSON.stringify({ name: user.name, email: user.email, phone: user.phone });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateUserAction(user.id, formData);

        if (result.success) {
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: formData.name,
                    email: formData.email
                },
            });
            toast.success(result.message!);
        } else {
            toast.error(result.error!);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? All your data and services will be permanently deleted!")) return;
        setLoading(true);
        const result = await deleteUserAction(user.id);
        if (result.success) {
            toast.success("The account has been deleted");
            signOut({ callbackUrl: "/" });
        } else {
            toast.error(result.error!);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* نموذج البيانات الشخصية */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your registered name and email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Phone number</Label>
                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3 border-t p-4">
                    <Button onClick={handleSave} disabled={loading || !hasChanges}>
                        <Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Changes saved"}
                    </Button>
                    {hasChanges && (
                        <Button variant="ghost" onClick={() => setFormData({ name: user.name, email: user.email, phone: user.phone })}>
                            <X className="w-4 h-4 mr-2" /> إلغاء
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* قسم التحذيرات */}
            {user.role !== 'admin' && (
                <Card className="border-yellow-500 bg-yellow-50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-700">
                            <AlertTriangle />
                            <CardTitle>System Warnings</CardTitle>
                        </div>
                        <span className="text-2xl font-black text-yellow-700">{user.warnings}</span>
                    </CardHeader>
                </Card>
            )}

            {/* منطقة الخطر */}
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" /> Danger zone
                    </CardTitle>
                    <CardDescription>Once you delete your account, you will not be able to recover your data again.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="text-red-50 rounded-2xl hover:rounded-lg bg-red-600 hover:bg-red-500 cursor-pointer" onClick={handleDelete} disabled={loading}>
                        {loading ? "Processing..." : "Delete my account permanently"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}