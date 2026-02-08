"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react"; // أضفنا signOut هنا
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react"; // أيقونات للتنبيه

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // حالة تحميل خاصة بالحذف
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [initialData, setInitialData] = useState({ name: "", email: "", phone: "" });

  // 1. جلب بيانات المستخدم (كما هي في كودك)
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "loading") return;
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`/api/user?email=${session?.user?.email}`);
        const data = await res.json();

        if (data.user) {
          const userData = {
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          };
          setFormData(userData);
          setInitialData(userData);
        }
      } catch (error) {
        toast.error("Failed to load profile data");
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
  }, [status, session, router]);

  // 2. معالجة طلب التحديث (كما هي في كودك)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (JSON.stringify(formData) === JSON.stringify(initialData)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/user?id=${(session?.user as any)?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Profile updated!");
        setInitialData(formData);
        await update({
          ...session,
          user: { ...session?.user, name: formData.name, email: formData.email },
        });
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Update failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. وظيفة حذف الحساب نهائياً
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: Are you sure you want to delete your account? This action is permanent and will delete all your services, bookings, and incoming requests."
    );

    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const userId = (session?.user as any)?.id;
      const res = await fetch(`/api/user?id=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Account and all data deleted.");
        // تسجيل الخروج فوراً وتوجيه المستخدم للرئيسية
        signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        toast.error(data.message || "Could not delete account.");
      }
    } catch (error) {
      toast.error("An error occurred during deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (status === "loading" || fetching) {
    return <div className="p-10 text-center animate-pulse text-zinc-500">Loading your settings...</div>;
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 pb-20">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      {/* نموذج المعلومات الشخصية */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your contact details and profile info.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={loading || !hasChanges}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              {hasChanges && !loading && (
                <Button variant="ghost" type="button" onClick={() => setFormData(initialData)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {(session?.user as any)?.role !== 'admin' && (<Card className="border-yellow-600/50 bg-yellow-950/100 backdrop-blur-sm">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-yellow-500">
              {/* أيقونة مع تأثير نبض بسيط لجذب الانتباه */}
              <div className="relative">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />
                <span className="absolute inset-0 animate-ping inline-flex h-full w-full rounded-full bg-yellow-500 opacity-20"></span>
              </div>

              <div>
                <CardTitle className="text-sm md:text-base font-black tracking-tighter uppercase italic">
                  System_Warnings_Detected
                </CardTitle>
              </div>
            </div>

            {/* رقم التحذيرات بشكل بارز */}
            <div className="flex flex-col items-end">
              <span className="text-2xl md:text-3xl font-black text-yellow-500 font-mono">
                {String((session?.user as any)?.warnings || 0).padStart(2, '0')}
              </span>
              <span className="text-[8px] text-yellow-600 font-bold uppercase">Points</span>
            </div>
          </div>
        </CardHeader>
      </Card>)}

      {/* قسم منطقة الخطر - حذف الحساب */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-700/70">
            Deleting your account is permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 mb-4">
            This will permanently delete your profile, your services, and all your existing bookings (both incoming and outgoing).
            Please make sure you have no pending obligations.
          </p>
        </CardContent>
        <CardFooter className="bg-red-200 border-t border-red-100 py-4">
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="flex gap-2 bg-red-500 cursor-pointer hover:bg-red-400"
          >
            {deleteLoading ? "Deleting..." : <><Trash2 className="h-4 w-4" /> Delete My Account</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}