import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password, phone } = await req.json();

        await connectMongoDB();

        // التأكد إذا كان الإيميل موجود مسبقاً
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }

        const nameExists = await User.findOne({ name });
        if (nameExists) {
            return NextResponse.json({ message: "Name already exists" }, { status: 401 });
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists && phone !== '') {
            return NextResponse.json({ message: "Phone already exists" }, { status: 402 });
        }

        // تشفير كلمة السر
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم الجديد
        await User.create({ name, email, password: hashedPassword, phone, isDeleted: false });

        return NextResponse.json({ message: "User registered successfully." }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred while registering." }, { status: 500 });
    }
}
