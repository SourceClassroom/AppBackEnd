import express from "express"
import *as apiValidator from "../utils/validator.js"
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as notificationController from "../controller/notificationController.js";
import *as resourceOwnerMiddleware from "../middlewares/resourceOwnerMiddleware.js";

const router = express.Router()

router.route("/").get(
    authenticateToken,
    notificationController.getNotifications
)

router.route("/remove/:notificationId").delete(
    authenticateToken,
    apiValidator.validateMongoId("notificationId"),
    apiValidator.validate,
    resourceOwnerMiddleware.checkNotificationOwner,
    notificationController.removeNotification
)

router.route("/mark-as-read/:notificationId").put(
    authenticateToken,
    apiValidator.validateMongoId("notificationId"),
    apiValidator.validate,
    resourceOwnerMiddleware.checkNotificationOwner,
    notificationController.markAsRead
)

router.route("/mark-all-as-read").put(
    authenticateToken,
    notificationController.markAllAsRead
)

export default router