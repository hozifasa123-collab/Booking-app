"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
// أضف SheetTitle و SheetHeader و SheetDescription هنا
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetHeader,
    SheetDescription
} from "@/components/ui/sheet";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

export default function MobileSidebar() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white bg-[#111827] hover:bg-zinc-800">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#111827] border-none">

                {/* --- الإضافة المطلوبة هنا لتعطيل الخطأ --- */}
                <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>
                        Access dashboard sections and settings
                    </SheetDescription>
                </SheetHeader>
                {/* -------------------------------------- */}

                <Sidebar />
            </SheetContent>
        </Sheet>
    );
}