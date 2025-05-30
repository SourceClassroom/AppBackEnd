import express from "express"
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as classController from "../controller/classController.js";


const router = express.Router()

//Get a class
router.route("/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    classController.getClass
)

//Join class
router.route("/join/:classCode").post(
    authenticateToken,
    apiValidator.validateClassCode("classCode"),
    apiValidator.validate,
    classController.joinClass
)

//Leave class
router.route("/leave/:classId").put(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    classController.leaveClass
)


//Kick student
router.route("/kick/:classId/:userId").put(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    classController.kickStudent
)

//Ban student
router.route("/ban/:classId/:userId").put(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    classController.banStudent
)

//Create Class
router.route("/create").post(
    authenticateToken,
    roleCheck.roleCheck(["teacher", "sysadmin"]),
    apiValidator.classValidate,
    apiValidator.validate,
    classController.createClass
)

//Update Class
router.route("/update/:classId").put(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateMongoId("classId"),
    apiValidator.classValidate,
    apiValidator.validate,
    classController.updateClass
)

//Delete Class
router.route("/delete/:classId").delete(
    authenticateToken,
    roleCheck.isClassTeacherOrOwner(),
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    classController.deleteClass
)

router.route("/students/:classId").get(
    authenticateToken,
    roleCheck.isClassMember(),
    classController.studentList
)

export default router