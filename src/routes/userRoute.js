import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as userController from "../controller/userController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

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
    upload.validateAndUpload("files", 1, 1),
    userController.changeAvatar
)

export default router;