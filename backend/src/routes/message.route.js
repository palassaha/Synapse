import express from "express";
import { getUsersInSidebar, getConversationsInSidebar, getMessagesByUserId, sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", getUsersInSidebar);
router.get("/conversations", getConversationsInSidebar);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", upload.single("media"), sendMessage);


export default router;