"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export default function AllReviewsClient({ initialReviews }: { initialReviews: any[] }) {
    // لا نحتاج لـ useEffect أو fetch هنا لأن البيانات تأتي جاهزة
    const reviews = initialReviews;

    return (
        <>
            {reviews.length === 0 ? (
                <p className="text-gray-500">No reviews yet for this service.</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review: any) => (
                        <div key={review._id} className="border-b pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-gray-200 p-2 rounded-full">
                                    <Avatar className="h-8 w-8 border border-white/20">
                                        <AvatarFallback className="bg-sky-600 text-white text-xs">
                                            {review.clientId?.name?.charAt(0).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{review.clientId?.name || "Anonymous"}</p>
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                fill={i < review.rating ? "currentColor" : "none"}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 ml-auto">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {review.comment}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}