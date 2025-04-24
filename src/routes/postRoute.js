import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import *as postController from "../controller/postController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as classMiddleware from "../middlewares/classMiddleware.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiles: 10,
        fileSize: 1024 * 1024 * 1024,
    }),
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateCreatePost,
    apiValidator.validate,
    postController.createPost
);

router.route("/class/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    postController.getClassPosts
)

router.route("/week/:classId/:weekId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("weekId"),
    apiValidator.validate,
    classMiddleware.checkWeekClassroom,
    roleCheck.isClassMember(),
    postController.getWeekPosts
)

router.route("/update/:classId/:postId").put(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("postId"),
    apiValidator.validate,
    classMiddleware.checkPostClassroom,
    roleCheck.isClassTeacherOrOwner(),
    postController.updatePost
)

router.route("/delete/:classId/:postId").delete(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("postId"),
    apiValidator.validate,
    classMiddleware.checkPostClassroom,
    roleCheck.isClassTeacherOrOwner(),
    postController.deletePost
)

export default router