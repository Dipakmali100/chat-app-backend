import express from "express";
import { changeAvatar, login, register, uniqueUsername, verify } from "../controllers/auth";
import { verifyToken } from "../utils/verifyToken";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyToken, verify);
router.post("/unique-username", uniqueUsername);
router.post("/change-avatar", verifyToken, changeAvatar);

export default router;