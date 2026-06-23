import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImagekitConfig, uploadMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function getUsersInSidebar(req, res) {
    try {
        const loggedInUser = req.user._id;

        const filteredUsers = await User.find({ _id: { $ne: loggedInUser } }).select("-clerkId")

        res.status(200).json({ filteredUsers })
    } catch (error) {
        console.error("Error in getUsersInSidebar:", error.message);
        res.status(500).json({ error: "Server error" });
    }
}

export async function getConversationsInSidebar(req, res) {
    try {
        const loggedInUser = req.user._id;

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: loggedInUser },
                        { receiverId: loggedInUser }]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", loggedInUser] },
                            "$receiverId",
                            "$senderId"
                        ]
                    },
                    lastMessage: { $max: "$createdAt" },
                },
            },
            {
                $sort: {
                    lastMessage: -1
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $first: "$userDetails"
                    }
                }
            },
            {
                $project: {
                    clerkId: 0
                }
            },
        ]);

        res.status(200).json(conversations);

    } catch (error) {
        console.error("Error in getConversationsInSidebar", error.message);
        res.status(500).json({ error: "Server error" });
    }
}

export async function getMessagesByUserId(req, res) {
    try {
        const { id: userIdChat } = req.params;
        const loggedInUser = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: loggedInUser, receiverId: userIdChat },
                { senderId: userIdChat, receiverId: loggedInUser },
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessagesByUserId", error.message);
        res.status(500).json({ error: "Server error" })
    }
}

export async function sendMessage(req, res) {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl
        let videoUrl

        if (req.file) {
            if (!hasImagekitConfig()) {
                return res.status(500).json({ error: "ImageKit configuration is missing" });
            }

            const url = await uploadMedia(req.file)

            if (req.file.mimetype.startsWith("image/")) {
                imageUrl = url;
            } else if (req.file.mimetype.startsWith("video/")) {
                videoUrl = url;
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            video: videoUrl
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);

        // Emit the new message to the receiver if they are online
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessage", error.message);
        res.status(500).json({ error: "Server error" });
    }
}