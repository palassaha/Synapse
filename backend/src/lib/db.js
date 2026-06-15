import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        const conn = await mongoose.connect(mongoUri);

        console.log("Connected to MongoDB", conn.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB", error.message);
        process.exit(1); // 1 - Fail, 0 - Success
    }
}