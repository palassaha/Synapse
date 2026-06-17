import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URL;

const io = new Server(server, {
    cors: {
        origin: [allowedOrigins]
    }
})

function getReceiverSocketId(userId) {
    return userSockets[userId];
}

const userSockets = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        userSockets[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSockets)); // sends broadcast event

    socket.on("disconnect", () => {
        if (userId) {
            delete userSockets[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSockets));
    })
})

export { app, server, io, getReceiverSocketId };