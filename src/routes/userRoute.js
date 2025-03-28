import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as userController from "../controller/userController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";

const router = express.Router()

router.route("/:id").get(
    apiValidator.validateMongoId("id"),
    apiValidator.validate,
    userController.getUsers
)

router.route("/login").post(userController.loginUser)

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

export default router;