import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Set public DNS servers to resolve MongoDB SRV records reliably and prevent querySrv ECONNREFUSED errors
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDb = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error; // Re-throw instead of exiting, let the server handle it
    }
}
export default connectDb;