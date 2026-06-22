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
        }

        const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);

        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload,
        });

        const event = await verifyWebhook(request, { signingSecret });

        console.log("Received Clerk webhook event:", event.data);

        if (event.type === "user.created" || event.type === "user.updated") {
            const userData = event.data;

            const email = userData.email_addresses?.find((e) => e.id === userData.primary_email_address_id)?.email_address ?? userData.email_addresses?.[0]?.email_address;

            const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(" ") || userData.username || email?.split("@")[0];

            await User.findOneAndUpdate(
                { clerkID: userData.id },
                { clerkID: userData.id, email, fullName, profilePic: userData.image_url },
                { upsert: true, returnDocument: "after" }
            )
        }

        if (event.type === "user.deleted") {
            if (event.data.id) await User.findOneAndDelete({ clerkID: event.data.id });
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error("Error processing Clerk webhook:", error);
        res.status(400).json({ error: "Invalid webhook payload or signature." });
    }

})

export default router;