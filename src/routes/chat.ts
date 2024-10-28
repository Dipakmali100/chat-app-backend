import { Router } from "express";
import { deleteChat, deleteMessage, getChat, getFriendList, sendMessage } from "../controllers/chat";
import { verifyToken } from "../utils/verifyToken";

const router= Router();

router.get("/get-friend-list", verifyToken, getFriendList);
router.post("/get-chat", verifyToken, getChat);
router.post("/send-message", verifyToken, sendMessage);
router.post("/delete-chat", verifyToken, deleteChat);
router.post("/delete-message", verifyToken, deleteMessage);

export default router;