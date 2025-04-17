import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as submissionCheck from "../middlewares/submissionCheck.js";
import *as submissionController from "../controller/submissionController.js"


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

router.route("/grade").put(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateGrade,
    apiValidator.validate,
    submissionController.gradeSubmission
)

router.route("/feedback").put(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateFeedback,
    apiValidator.validate,
    submissionController.feedbackSubmission
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
    submissionController.createSubmission
)

export default router