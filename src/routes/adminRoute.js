import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as adminController from "../controller/adminController.js";
import {validateUpdateUserForAdmin} from "../utils/validator.js";

const router = express.Router()

router.route("/get-users").get(
    authenticateToken,
    roleCheck.isSysadmin(),
    adminController.getUsers
)

router.route("/get-pending-users").get(
    authenticateToken,
    roleCheck.isSysadmin(),
    adminController.getPendingUsers
)

router.route("/get-classes").get(
    authenticateToken,
    roleCheck.isSysadmin(),
    adminController.getClasses
)

router.route("/search-users").get(
    authenticateToken,
    roleCheck.isSysadmin(),
    adminController.searchUsers
)

router.route("/update-user").put(
    authenticateToken,
    roleCheck.isSysadmin(),
    apiValidator.validateUpdateUserForAdmin,
    apiValidator.validate,
    adminController.updateUser
)

router.route("/update-user-status").put(
    authenticateToken,
    roleCheck.isSysadmin(),
    apiValidator.validateUserStatus,
    apiValidator.validate,
    adminController.updateUserStatus
)

export default router;
