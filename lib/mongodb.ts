import mongoose from "mongoose";

// Define the connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Throw error if URI is missing
if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectMongoDB() {
    // 1. If we have a cached connection, return it
    if (cached.conn) {
        return cached.conn;
    }

    // 2. If no promise exists, create a new connection promise
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        // We use MONGODB_URI! (non-null assertion) because we checked it above
        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
            console.log("✅ Successfully connected to MongoDB");
            return mongooseInstance;
        });
    }

    // 3. Wait for the promise and cache the connection
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("❌ Error connecting to MongoDB:", e);
        throw e;
    }

    return cached.conn;
}

export default connectMongoDB;