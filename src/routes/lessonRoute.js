import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as lessonController from "../controller/lessonController.js"

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateLesson,
    apiValidator.validate,
    lessonController.createLesson
)

export default router;
