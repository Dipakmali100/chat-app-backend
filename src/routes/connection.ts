import { Router } from "express";
import { verifyToken } from "../utils/verifyToken";
import { connect, searchUser } from "../controllers/connection";

const router= Router();

router.post("/search-user", verifyToken, searchUser);
router.post("/connect", verifyToken, connect);

export default router;