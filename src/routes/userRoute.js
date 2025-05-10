import express from "express"
import upload from "../middlewares/upload.js";
import {fileTypes} from "../utils/fileTypes.js";
import *as apiValidator from "../utils/validator.js";
import *as userController from "../controller/userController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

router.route("/profile/:id").get(
    authenticateToken,
    apiValidator.validateMongoId("id"),
    apiValidator.validate,
    userController.getUserProfile
)

router.route("/dashboard").get(
    authenticateToken,
    userController.userDashboard
)

router.route("/login").post(userController.loginUser)

router.route("/logout").post(authenticateToken, userController.logoutUser)

router.route("/verify").post(
    apiValidator.validateMailVerification,
    apiValidator.validate,
    userController.verifyMail
)
router.route("/generate-code").post(
    userController.generateVerificationCode
)

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

router.route("/change-mail").put(
    authenticateToken,
    apiValidator.newEmailValidator,
    apiValidator.validate,
    userController.changeEmail
)

router.route("/update-notifications").put(
    authenticateToken,
    apiValidator.validateNotificationPreferences,
    apiValidator.validate,
    userController.updateNotificationPreferences
)

router.route("/update").put(
    authenticateToken,
    apiValidator.validateProfileUpdate,
    apiValidator.validate,
    userController.updateProfile
)

router.route("/change-avatar").put(
    authenticateToken,
    upload.validateAndUpload({
            fieldName: "files",
            minFiles: 1,
            maxFiles: 1,
            fileSize: 5 * 1024 * 1024,
            allowedTypes: fileTypes.images
        }),
    userController.changeAvatar
)

export default router;