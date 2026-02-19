"use server";

import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function registerAction(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const phone = formData.get("phone") as string;

        await connectMongoDB();

        // فحص وجود البيانات مسبقاً
        if (await User.findOne({ email })) return { error: "Email already exists", status: 400 };
        if (await User.findOne({ name })) return { error: "Name already exists", status: 401 };
        if (phone && await User.findOne({ phone })) return { error: "Phone already exists", status: 402 };

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ name, email, password: hashedPassword, phone, isDeleted: false });

        return { success: true };
    } catch (error) {
        return { error: "An error occurred while registering." };
    }
}