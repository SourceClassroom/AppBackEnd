import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as classMiddleware from "../middlewares/classMiddleware.js";
import *as lessonController from "../controller/lessonController.js"

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateLesson,
    apiValidator.validate,
    lessonController.createLesson
)

router.route("/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    lessonController.getClassLessons
)

router.route("/:classId/:weekId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("weekId"),
    apiValidator.validate,
    classMiddleware.checkWeekClassroom,
    roleCheck.isClassMember(),
    lessonController.getWeekLessons
)

router.route("/update-status/:lessonId").put(
    authenticateToken,
    apiValidator.validateMongoId("lessonId"),
    apiValidator.validateLessonStatus,
    apiValidator.validate,
    classMiddleware.checkLessonClassroom,
    roleCheck.isClassTeacherOrOwner(),
    lessonController.updateLessonStatus
)

router.route("/update/:lessonId").put(
    authenticateToken,
    apiValidator.validateMongoId("lessonId"),
    apiValidator.validateLesson,
    apiValidator.validate,
    classMiddleware.checkLessonClassroom,
    roleCheck.isClassTeacherOrOwner(),
    lessonController.updateLesson
)

export default router;
