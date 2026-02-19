import mongoose, { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 0, max: 5 }, // التقييم من 1 لـ 5
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Review = models.Review || model("Review", ReviewSchema);
export default Review;