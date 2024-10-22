import { Router } from "express";
import { verifyToken } from "../utils/verifyToken";
import { connect, disconnect, searchUser } from "../controllers/connection";

const router= Router();

router.post("/search-user", verifyToken, searchUser);
router.post("/connect", verifyToken, connect);
router.post("/disconnect", verifyToken, disconnect);

export default router;