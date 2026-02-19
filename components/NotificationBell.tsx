"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import Link from "next/link";
import { 
    getNotificationsAction, 
    markAsReadAction, 
    deleteNotificationAction 
} from "@/app/actions/notificationActions";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const loadData = async () => {
        const res = await getNotificationsAction();
        if (res.success) {
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000); // تحديث كل دقيقة
        return () => clearInterval(interval);
    }, []);

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            setUnreadCount(0);
            await markAsReadAction();
        }
    };

    const deleteNotif = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        // تحديث الواجهة فوراً (Optimistic Update)
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        
        const res = await deleteNotificationAction(id);
        if (!res.success) {
            loadData(); // إعادة التحميل في حال فشل الحذف في السيرفر
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
                                            {new Date(notif.createdAt).toLocaleString('en-US')}
                                        </span>
                                    </Link>
                                    
                                    <button 
                                        onClick={(e) => deleteNotif(e, notif._id)}
                                        className="absolute top-3 right-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={18} />
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