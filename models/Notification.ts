import mongoose, { Schema, models, model } from "mongoose";

const NotificationSchema = new Schema(
    {
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // من سيستلم الإشعار
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },    // من تسبب في الإشعار
        message: { type: String, required: true },                                        // نص الإشعار
        link: { type: String },                                                           // رابط يضغط عليه المستخدم (مثلاً لصفحة الحجز)
        isRead: { type: Boolean, default: false },                                        // هل قرأ المستخدم الإشعار؟
    },
    { timestamps: true }
);

const Notification = models.Notification || model("Notification", NotificationSchema);
export default Notification;