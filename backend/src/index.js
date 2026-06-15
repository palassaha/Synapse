import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express';
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Middlewares
app.use(express.json());
app.use(cors(
    {
        origin: FRONTEND_URL,
        credentials: true,
    }
));
app.use(clerkMiddleware());


app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Up and running",
    })
})


app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})