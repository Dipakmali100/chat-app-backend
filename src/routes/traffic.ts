import { Router } from "express";
import { updateTraffic } from "../controllers/traffic";

const router = Router();

router.get("/update-traffic", updateTraffic);

export default router;