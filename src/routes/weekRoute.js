import express from "express"
import apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import *as weekController from "../controller/weekController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateCreateWeek,
    apiValidator.validate,
    weekController.createWeek
    );

export default router