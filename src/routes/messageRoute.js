import express from 'express';
import *as apiValidator from "../utils/validator.js";
import { authenticateToken } from '../middlewares/authMiddleware.js';
import *as messageController from "../controller/messageController.js";

const router = express.Router();

router.route("/:conversationId").get(
    authenticateToken,
    messageController.getMessages
)

export default router;

