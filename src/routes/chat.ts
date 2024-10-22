import { Router } from "express";
import { deleteChat, getChat, getFriendList, sendMessage } from "../controllers/chat";
import { verifyToken } from "../utils/verifyToken";

const router= Router();

router.get("/get-friend-list", verifyToken, getFriendList);
router.post("/get-chat", verifyToken, getChat);
router.post("/send-message", verifyToken, sendMessage);
router.post("/delete-chat", verifyToken, deleteChat);

export default router;