import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as userController from "../controller/userController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {fileTypes, allAllowedFileTypes} from "../utils/fileTypes.js"


const router = express.Router()

router.route("/:id").get(
    apiValidator.validateMongoId("id"),
    apiValidator.validate,
    userController.getUsers
)

router.route("/login").post(userController.loginUser)

router.route("/logout").post(authenticateToken, userController.logoutUser)

router.route("/register").post(
    apiValidator.userCreateValidationRules,
    apiValidator.validate,
    userController.createUser
);

router.route("/change-password").put(
    authenticateToken,
    apiValidator.newPasswordValidator,
    apiValidator.validate,
    userController.changePassword
);

router.route("/change-avatar").put(
    authenticateToken,
    upload.validateAndUpload({
            fieldName: "files",
            minFiles: 1,
            maxFiled: 1,
            fileSize: 10 * 1024 * 1024,
            allowedTypes: fileTypes.images
        }),
    userController.changeAvatar
)

export default router;