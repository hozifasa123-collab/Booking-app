import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  // الحالة: نشط أو موقوف
  status: {
    type: String,
    enum: ["active", "suspended"],
    default: "active"
  },
  // عداد التحذيرات
  warnings: {
    type: Number,
    default: 0
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);