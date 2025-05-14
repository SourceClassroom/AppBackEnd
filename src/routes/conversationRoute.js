import express from 'express';
import upload from "../middlewares/upload.js";
import *as apiValidator from "../utils/validator.js";
import { authenticateToken } from '../middlewares/authMiddleware.js';
import * as conversationController from '../controller/conversationController.js';
import {fileTypes} from "../utils/fileTypes.js";

const router = express.Router();

router.route('/get-conversations').get(
    authenticateToken,
    conversationController.getConversations
)
router.route("/create").post(
    authenticateToken,
    apiValidator.validateCreateConversation,
    apiValidator.validate,
    conversationController.createConversation
)
router.route("/add-participant").put(
    authenticateToken,
    apiValidator.validateAddRemoveParticipant,
    apiValidator.validate,
    conversationController.addParticipant
)
router.route("/remove-participant").put(
    authenticateToken,
    apiValidator.validateAddRemoveParticipant,
    apiValidator.validate,
    conversationController.removeParticipant
)
router.route("/delete/:conversationId").delete(
    authenticateToken,
    apiValidator.validateMongoId("conversationId"),
    apiValidator.validate,
    conversationController.deleteConversation
)
router.route("/change-image/:conversationId").put(
    authenticateToken,
    upload.validateAndUpload({
        fieldName: "files",
        minFiles: 0,
        maxFiles: 1,
        fileSize: 5 * 1024 * 1024,
        allowedTypes: fileTypes.images
    }),
    apiValidator.validateMongoId("conversationId"),
    apiValidator.validate,
    conversationController.changeGroupImage
)

router.route("/leave").put(
    authenticateToken,
    apiValidator.validateMongoId("conversationId"),
    apiValidator.validate,
    conversationController.leaveConversation
)

router.route("/mute/:conversationId").put(
    authenticateToken,
    apiValidator.validateMongoId("conversationId"),
    apiValidator.validate,
    conversationController.muteConversation
)

router.route("/unmute/:conversationId").put(
    authenticateToken,
    apiValidator.validateMongoId("conversationId"),
    apiValidator.validate,
    conversationController.unmuteConversation
)

export default router;