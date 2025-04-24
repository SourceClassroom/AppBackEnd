import express from "express"
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as materialController from "../controller/materialController.js";

const router = express.Router()

router.route("/create").post(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 1,
        maxFiles: 20,
        fileSize: 1024 * 1024 * 1024,
    }),
    apiValidator.validateCreateMaterial,
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    materialController.createMaterial
)

router.route("/:classId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    materialController.getClassMaterials
)

router.route("/:classId/:weekId").get(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("weekId"),
    apiValidator.validate,
    roleCheck.isClassMember(),
    materialController.getWeekMaterials
)

//TODO add class material check
router.route("/delete/:classId/:materialId").delete(
    authenticateToken,
    apiValidator.validateMongoId("classId"),
    apiValidator.validateMongoId("materialId"),
    apiValidator.validate,
    roleCheck.isClassTeacherOrOwner(),
    materialController.deleteMaterial
)


export default router