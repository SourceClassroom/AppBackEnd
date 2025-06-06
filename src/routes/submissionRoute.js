import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as submissionCheck from "../middlewares/submissionCheck.js";
import *as submissionController from "../controller/submissionController.js"
import *as classMiddleware from "../middlewares/classMiddleware.js"

const router = express.Router()

router.route("/all/:classId/:assignmentId").get(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("assignmentId"),
    apiValidator.validate,
    submissionController.getSubmissions
)

router.route("/:classId/:submissionId").get(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("submissionId"),
    apiValidator.validate,
    submissionController.getASubmission
)

router.route("/user-submission/:classId/:assignmentId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("assignmentId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    submissionController.getUserSubmissions
)

router.route("/review").put(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateGrade,
    apiValidator.validate,
    submissionController.reviewSubmission
)

router.route("/submit").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiles: 5,
        fileSize: 1024 * 1024 * 1024,
    }),
    roleCheck.isClassMember(),
    submissionCheck.checkUserSubmissions(),
    apiValidator.validateSubmission,
    apiValidator.validate,
    classMiddleware.checkAssignmentClassroom,
    submissionController.createSubmission
)

export default router