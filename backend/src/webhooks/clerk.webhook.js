import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

        if (!signingSecret) {
            return res.status(500).json({ error: "Webhook signing secret is not configured." });
            return;
        }

        const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);

        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload,
        });

        const event = await verifyWebhook(request, { signingSecret });

        if (event.type === "user.created" || event.type === "user.updated") {
            const userData = event.data;
            const clerkId = typeof userData?.id === "string" ? userData.id.trim() : userData?.id;

            if (!clerkId) {
                console.error("Clerk webhook payload is missing a user id", {
                    type: event.type,
                    data: userData,
                });
                return res.status(400).json({ error: "Webhook payload missing Clerk user id." });
            }

            const email = userData.email_addresses?.find((e) => e.id === userData.primary_email_address_id)?.email_address ?? userData.email_addresses?.[0]?.email_address;

            const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(" ") || userData.username || email?.split("@")[0];

            await User.findOneAndUpdate(
                { clerkId },
                { clerkId, email, fullName, profilePic: userData.image_url },
                { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
            )
        }

        if (event.type === "user.deleted") {
            const clerkId = typeof event.data?.id === "string" ? event.data.id.trim() : event.data?.id;

            if (clerkId) await User.findOneAndDelete({ clerkId });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Error processing Clerk webhook:", error);
        res.status(400).json({ error: "Invalid webhook payload or signature." });
    }

})

export default router;