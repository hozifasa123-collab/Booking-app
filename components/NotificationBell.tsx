"use client";
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react"; // استيراد أيقونة X
import Link from "next/link";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            setUnreadCount(0);
            await fetch("/api/notifications", { method: "PUT" });
        }
    };

    // تحديث دالة الحذف لتحديث الواجهة فوراً
    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // منع الانتقال للرابط عند الضغط على X
        e.stopPropagation(); // منع إغلاق القائمة

        const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });

        if (res.ok) {
            // حذف الإشعار من القائمة في الواجهة بدون ريفريش
            setNotifications((prev) => prev.filter((n: any) => n._id !== id));
        }
    };

    return (
        <div className="relative">
            <button onClick={handleOpen} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute -left-44 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 font-bold text-gray-700">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-center text-sm text-gray-500">There are no notifications at the moment</p>
                        ) : (
                            notifications.map((notif: any) => (
                                <div key={notif._id} className="relative group"> 
                                    <Link
                                        href={notif.link || "#"}
                                        onClick={() => setIsOpen(false)}
                                        className={`block p-3 border-b border-gray-50 hover:bg-gray-50 transition ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <p className="text-sm text-gray-800 pr-6">{notif.message}</p>
                                        <span className="text-xs text-gray-400">
                                            {new Date(notif.createdAt).toLocaleString('ar-EG')}
                                        </span>
                                    </Link>
                                    
                                    {/* زر الحذف يظهر عند الحوم (Hover) فوق الإشعار */}
                                    <button 
                                        onClick={(e) => deleteNotification(e, notif._id)}
                                        className="absolute top-3 right-2 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <X size={25} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
