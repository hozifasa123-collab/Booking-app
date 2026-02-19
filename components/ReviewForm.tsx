"use client";

import { useState } from "react";
import { Star, RotateCcw, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { createReviewAction } from "@/app/actions/reviewActions"; // استيراد الأكشن

interface ReviewFormProps {
  serviceId: string;
  bookingId: string;
  onSuccess: () => void;
}

export default function ReviewForm({ serviceId, bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0); 
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // التحقق من وجود تعليق على الأقل
    if (!comment.trim()) {
      return toast.error("Please write a comment before submitting.");
    }

    setLoading(true);

    try {
      // استدعاء السيرفر أكشن مباشرة
      const result = await createReviewAction({
        serviceId,
        bookingId,
        rating,
        comment,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit review");
      }

      toast.success("Thank you for your feedback! ✨");
      
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mt-4 w-full max-w-md mx-auto">
      <h3 className="text-lg font-bold text-gray-800 text-center mb-4">
        Rate your experience
      </h3>

      {/* منطقة النجوم */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transform transition-transform active:scale-90 focus:outline-none"
            >
              <Star
                size={36}
                fill={(hover || rating) >= star ? "#facc15" : "transparent"}
                color={(hover || rating) >= star ? "#facc15" : "#e5e7eb"}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-400">
            Rating: <span className="text-gray-700 font-bold">{rating}/5</span>
          </span>
          {rating > 0 && (
            <button
              onClick={() => setRating(0)}
              className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 transition-colors"
            >
              <RotateCcw size={12} /> Reset to 0
            </button>
          )}
        </div>
      </div>

      {/* صندوق التعليق */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2 px-1">
          Your Feedback
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about the service..."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm text-gray-700"
        />
      </div>

      {/* زر الإرسال */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <Send size={18} /> Submit Review
          </>
        )}
      </button>
    </div>
  );
}