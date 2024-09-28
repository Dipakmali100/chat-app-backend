import express from "express";
import { login, register, verify } from "../controllers/auth";
import { verifyToken } from "../utils/verifyToken";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyToken, verify);

export default router;