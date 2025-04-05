import express from "express"
import upload from "../middlewares/upload.js"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as assignmentController from "../controller/assignmentController.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiled: 20,
        fileSize: 1024 * 1024 * 1024,
    }),
    apiValidator.validateCreateAssignment,
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    assignmentController.createAssignment
)

router.route("/class/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    assignmentController.getClassAssignments
)

export default router