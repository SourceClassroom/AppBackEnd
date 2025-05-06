import * as messageModule from "../database/modules/messageModule.js";
import * as conversationModule from "../database/modules/conversationModule.js";
import * as messagingService from "../services/messagingService.js";

/**
 * Send a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, content, attachments } = req.body;
        
        // Check if the user is a participant in the conversation
        const conversation = await conversationModule.getConversationById(conversationId);
        
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
        const { conversationId } = req.params;
        const { limit = 50, skip = 0 } = req.query;
        
        // Check if the user is a participant in the conversation
        const conversation = await conversationModule.getConversationById(conversationId);
        
        const isParticipant = conversation.participants.some(
            participant => participant._id.toString() === req.user.id
        );
        
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }
        
        const messages = await messageModule.getConversationMessages(
            conversationId,
            parseInt(limit),
            parseInt(skip)
        );
        
        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
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

/**
 * Delete a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        // Get the message to check if the current user is the sender
        const message = await messageModule.getMessage(messageId);
        
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages'
            });
        }
        
        await messageModule.deleteMessage(messageId);
        
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};