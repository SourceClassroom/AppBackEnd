import express from 'express';
import *as apiValidator from "../utils/validator.js";
import { authenticateToken } from '../middlewares/authMiddleware.js';
import * as conversationController from '../controller/conversationController.js';

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

export default router;