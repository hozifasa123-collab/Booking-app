"use client";

import { useEffect, useState, use } from "react"; // استورد use هنا
import { toast } from "react-hot-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react"

export default function AllReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  // فك الـ Promise الخاص بـ params
  const resolvedParams = use(params);
  const serviceId = resolvedParams.id;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // الآن نستخدم serviceId الذي تم فكه بأمان
    if (!serviceId || serviceId === "undefined") return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews?serviceId=${serviceId}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (error) {
        toast.error("Error loading reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [serviceId]); // نعتمد على الـ serviceId المفكوك هنا// الـ Effect هيشتغل تاني أول ما الـ id يتغير من undefined لقيمة حقيقية

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>

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
                                            {review.clientId?.name.charAt(0).toUpperCase()}
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
        </div>
    );
}