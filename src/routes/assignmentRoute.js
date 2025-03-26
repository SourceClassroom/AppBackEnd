import express from "express"
import upload from "../middlewares/upload.js"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as assignmentController from "../controller/assignmentController.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    upload.validateAndUpload("files", 0, 20),
    apiValidator.validateCreateAssignment,
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    assignmentController.createAssignment
)

export default router