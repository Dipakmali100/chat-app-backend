import { Router } from "express";
import { verifyToken } from "../utils/verifyToken";
import { createOrder, verifyPayment } from "../controllers/payment";

const router = Router();

router.post("/create-order", verifyToken, createOrder);
router.post("/verify-payment", verifyToken, verifyPayment);

export default router;