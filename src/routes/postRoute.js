import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import *as postController from "../controller/postController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiled: 10,
        fileSize: 1024 * 1024 * 1024,
    }),
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateCreatePost,
    apiValidator.validate,
    postController.createPost
);

export default router