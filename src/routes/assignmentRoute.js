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
        maxFiles: 20,
        fileSize: 1024 * 1024 * 1024,
    }),
    apiValidator.validateCreateAssignment,
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    assignmentController.createAssignment
)

router.route("/update/:classId/:assignmentId").put(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("assignmentId"),
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    assignmentController.updateAssignment
)

router.route("/class/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    assignmentController.getClassAssignments
)

router.route("/week/:classId/:weekId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("weekId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    assignmentController.getWeekAssignments
)

export default router