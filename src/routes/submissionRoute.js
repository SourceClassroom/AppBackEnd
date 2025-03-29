import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as submissionCheck from "../middlewares/submissionCheck.js";
import *as submissionController from "../controller/submissionController.js"


const router = express.Router()

router.route("/submit").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiled: 5,
        fileSize: 1024 * 1024 * 1024,
    }),
    roleCheck.isClassMember(),
    submissionCheck.checkUserSubmissions(),
    apiValidator.validateSubmission,
    apiValidator.validate,
    submissionController.createSubmission
)

export default router