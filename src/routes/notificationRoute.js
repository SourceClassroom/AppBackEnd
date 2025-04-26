import express from "express"
import *as roleCheck from "../middlewares/roleCheck.js";
import *as notificationController from "../controller/notificationController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

export default router