"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Globe,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  Settings,
  LogOut,
  ChevronUp,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// استيراد الجرس (تأكد من إنشاء ملفه في components/NotificationBell.tsx)
import NotificationBell from "@/components/NotificationBell";

export default function Sidebar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  const routes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "text-sky-500" },
    { label: "All Services", icon: Globe, href: "/dashboard/services", color: "text-violet-500" },
    { label: "My Services", icon: Briefcase, href: "/dashboard/my-services", color: "text-pink-700" },
    { label: "Incoming Bookings", icon: CalendarCheck, href: "/dashboard/bookings", color: "text-orange-700" },
    { label: "My Bookings", icon: CalendarClock, href: "/dashboard/my-bookings", color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white border-r border-white/10 w-full">
      <div className="px-3 py-2 flex-1">
        {/* Header مع الجرس */}
        <div className="flex items-center justify-between pl-3 mb-14 pr-2">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Booking<span className="text-sky-500">App</span>
            </h1>
          </Link>

          {/* إضافة الجرس هنا */}
          <div className="bg-white/5 p-1 rounded-full hover:bg-white/10 transition">
            <NotificationBell />
          </div>
        </div>

        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10 mx-3 w-auto" />

      {/* Profile & Settings Section */}
      <div className="px-3 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center w-full p-3 text-sm font-medium hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white outline-none">
              <Avatar className="h-8 w-8 border border-white/20">
                <AvatarFallback className="bg-sky-600 text-white text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start ml-3 overflow-hidden text-left">
                <span className="text-sm font-semibold text-white truncate w-full">
                  {user?.name || "User Name"}
                </span>
                <span className="text-xs text-zinc-500 truncate w-full text-[10px]">
                  {user?.email}
                </span>
              </div>
              <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={12}
            className="w-64 bg-[#111827] border-white/10 text-white p-2 shadow-2xl z-[9999]"
          >
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white p-2 rounded-md">
              <Link href="/dashboard/settings" className="flex items-center w-full">
                <Settings className="h-4 w-4 mr-3 text-zinc-400" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center p-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-md mt-1"
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span>Sign out</span>
            </DropdownMenuItem>
            {(user as any)?.role === 'admin' &&
              (<Link href='/admin'>
                <DropdownMenuItem
                  className="flex items-center p-2 cursor-pointer text-green-400 focus:bg-green-500/10 focus:text-green-400 rounded-md mt-1"
                >
                  <RefreshCw className="h-4 w-4 mr-3" />
                  <span>ADMIN_VIEW</span>
                </DropdownMenuItem>
              </Link>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}