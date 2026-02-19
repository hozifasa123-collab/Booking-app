// [id]/reviews/page.tsx
import { getReviewsAction } from "@/app/actions/reviewActions";
import AllReviewsClient from "@/components/reviews/AllReviewsClient";

export default async function AllReviewsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // جلب البيانات مباشرة في السيرفر
    const result = await getReviewsAction(id);
    const reviews = result.success ? result.data : [];

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>

            {/* إرسال البيانات للـ Client Component */}
            <AllReviewsClient initialReviews={reviews} />
        </div>
    );
}