import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as attachmentController from "../controller/attachmentController.js"

const router = express.Router()

//better rolecheck for attachments
//I did i guess
router.route("/submission/download/:classId/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.checkFilePermission(),
    attachmentController.downloadAttachment
)

router.route("/download/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validate,
    roleCheck.checkFilePermission(),
    attachmentController.downloadAttachment
)

router.route("/general/download/:classId/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.checkFilePermission(),
    attachmentController.downloadAttachment
)


router.route("/avatar/:userId").get(
    authenticateToken,
    apiValidator.validateMongoId("userId"),
    apiValidator.validate,
    attachmentController.viewUserAvatar
)

router.route("/view/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validate,
    roleCheck.checkFilePermission(),
    attachmentController.viewAttachment
)

router.route("/upload").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiles: 5,
        fileSize: 10 * 1024 * 1024,
    }),
    attachmentController.uploadAttachment
)

export default router;
