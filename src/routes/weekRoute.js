import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import *as weekController from "../controller/weekController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as classMiddleware from "../middlewares/classMiddleware.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateWeek,
    apiValidator.validate,
    weekController.createWeek
);

router.route("/update/:classId/:weekId").put(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("weekId"),
    apiValidator.validateWeek,
    apiValidator.validate,
    classMiddleware.checkWeekClassroom,
    roleCheck.isClassTeacherOrOwner(),
    weekController.updateWeek
)

router.route("/get/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    weekController.getClassWeeks
)

export default router