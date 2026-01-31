import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // الحقل المضاف: ليسهل على مقدم الخدمة العثور على حجوزاته الواردة
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed'
    },
    statusCustomerDelete: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    statusAdminDelete: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
}, { timestamps: true });

// تحديث الـ Index ليشمل البحث بواسطة صاحب الخدمة أيضاً
BookingSchema.index({ providerId: 1, startTime: 1 });
BookingSchema.index({ serviceId: 1, startTime: 1, endTime: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);