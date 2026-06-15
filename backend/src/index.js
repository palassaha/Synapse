import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express';
import cors from "cors";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicPath = path.join(process.cwd(), "public");

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

// For production, serve the frontend static files
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    app.get("*", (req, res, next) => {
        res.sendFile(path.join(publicPath, "index.html"), (err) => next(err));
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})