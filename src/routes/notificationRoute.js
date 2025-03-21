import express from "express"
import *as roleCheck from "../middlewares/roleCheck.js";
import *as notificationController from "../controller/notificationController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

router.route("/send").post(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    notificationController.sendNotificationtoClass
);

export default router