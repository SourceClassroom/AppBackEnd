import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as commentController from "../controller/commentController.js";

const router = express.Router()

router.route("/:classId/:postId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("postId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    commentController.getComments
)

router.route("/create").post(
    authenticateToken,
    roleCheck.isClassMember(),
    apiValidator.validateComment,
    apiValidator.validate,
    commentController.createComment
)

export default router;
