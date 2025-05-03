import express from "express"
import *as apiValidator from "../utils/validator.js"
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as eventController from "../controller/eventController.js";
import {listUserEvents} from "../controller/eventController.js";

const router = express.Router()

router.route("/").get(
    authenticateToken,
    eventController.listUserEvents
)

router.route("/create").post(
    authenticateToken,
    apiValidator.validateEvent,
    apiValidator.validate,
    eventController.createEvent
)

export default router;
