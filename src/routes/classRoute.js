import express from "express"
import apiValidator from "../utils/validator.js"
import *as roleCheck from "../middlewares/roleCheck.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import *as classController from "../controller/classController.js";
import {isClassMember} from "../middlewares/roleCheck.js";


const router = express.Router()

router.route("/:classId").get(authenticateToken, apiValidator.validateMongoId("classId"), apiValidator.validate, roleCheck.isClassMember(), classController.getClass)

router.route("/create").post(authenticateToken, apiValidator.classCreateValidationRules, apiValidator.validate, classController.createClass)

export default router