import express from "express"
import *as zoomController from "../controller/zoomController.js"
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

router.route("/oauth").post(
    authenticateToken,
    zoomController.authUser
)

export default router;
