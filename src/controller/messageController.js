import ApiResponse from "../utils/apiResponse.js";
import * as messagingService from "../services/messagingService.js";

//Cache Modules
import * as conversationCacheModule from "../cache/modules/conversationModule.js";

//Databse Modules
import * as conversationDatabaseModule from "../database/modules/conversationModule.js";

/**
 * Send a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, content, attachments } = req.body;
        
        // Check if the user is a participant in the conversation
        const conversation = await conversationDatabaseModule.getConversationById(conversationId);
        
        const isParticipant = conversation.participants.some(
            participant => participant._id.toString() === req.user.id
        );
        
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }
        
        // Send the message using the messaging service
        const message = await messagingService.sendMessage(
            conversationId,
            req.user.id,
            content,
            attachments || []
        );
        
        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get messages for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMessages = async (req, res) => {
    try {
        console.log("ANASKM")
        const { conversationId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Check if the user is a participant in the conversation
        const conversationData = await conversationCacheModule.getCachedConversation(conversationId, conversationDatabaseModule.getConversationById)

        const isParticipant = conversationData.participants.some(
            participant => participant.toString() === req.user.id
        );
        if (!isParticipant) {
            return res.status(403).json(ApiResponse.forbidden("Bu işlem için yetkiniz yok"));
        }

        const messages = await messagingService.getConversationMessages(
            conversationId,
            parseInt(limit),
            parseInt(skip)
        );

        return res.status(200).json(ApiResponse.success("Mesajlar", messages));
    } catch (error) {
        console.error(error)
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * Mark a message as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        // Mark the message as read using the messaging service
        const message = await messagingService.markAsRead(messageId, req.user.id);
        
        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
