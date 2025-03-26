import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as attachmentController from "../controller/attachmentController.js"

const router = express.Router()

//TODO better rolecheck for attachments
router.route("/submission/download/:classId/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    attachmentController.downloadAttachment
)

router.route("/material/download/:classId/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    attachmentController.downloadAttachment
)

//TODO ROLECHECK
router.route("/view/:id").get(attachmentController.viewAttachment)

export default router;
