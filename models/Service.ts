import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Service title is required']
    },
    description: String,
    duration: {
        type: Number,
        required: [true, 'Duration in minutes is required'],
        default: 30
    },
    price: {
        type: Number,
        default: 0
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: String,
    // داخل ServiceSchema
    availableFrom: {
        type: String,
        default: "09:00", // القيمة الافتراضية
    },
    availableTo: {
        type: String,
        default: "17:00",
    },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);