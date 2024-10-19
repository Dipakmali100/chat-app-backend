import express from "express";
import { login, register, uniqueUsername, verify } from "../controllers/auth";
import { verifyToken } from "../utils/verifyToken";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyToken, verify);
router.post("/unique-username", uniqueUsername);

export default router;