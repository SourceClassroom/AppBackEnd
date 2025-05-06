import { Message } from "../models/messageModel.js";
import { updateLastMessage } from "./conversationModule.js";

/**
 * Create a new message
 * @param {String} conversationId - The conversation ID
 * @param {String} senderId - The sender user ID
 * @param {String} content - The message content
 * @param {Array} attachments - Array of attachment IDs (optional)
 * @returns {Promise<Object>} - The created message
 */
export const createMessage = async (conversationId, senderId, content, attachments = []) => {
    try {
        const message = new Message({
            conversation: conversationId,
            sender: senderId,
            content,
            attachments
        });

        await message.save();
        
        // Update the conversation's last message
        await updateLastMessage(conversationId, message._id);
        
        // Populate sender information
        await message.populate('sender', 'name email profilePicture');
        
        return message;
    } catch (error) {
        throw new Error(`Error creating message: ${error.message}`);
    }
};

/**
 * Get a message by ID
 * @param {String} messageId - The message ID
 * @returns {Promise<Object>} - The message
 */
export const getMessage = async (messageId) => {
    try {
        const message = await Message.findById(messageId);
        
        if (!message) {
            throw new Error('Message not found');
        }
        
        return message;
    } catch (error) {
        throw new Error(`Error getting message: ${error.message}`);
    }
};

/**
 * Get messages for a conversation
 * @param {String} conversationId - The conversation ID
 * @param {Number} limit - Number of messages to retrieve (default: 50)
 * @param {Number} skip - Number of messages to skip (for pagination)
 * @returns {Promise<Array>} - Array of messages
 */
export const getConversationMessages = async (conversationId, limit = 50, skip = 0) => {
    try {
        const messages = await Message.find({
            conversation: conversationId,
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name email profilePicture')
        .lean();
        
        return messages;
    } catch (error) {
        throw new Error(`Error getting conversation messages: ${error.message}`);
    }
};

/**
 * Mark a message as read by a user
 * @param {String} messageId - The message ID
 * @param {String} userId - The user ID who read the message
 * @returns {Promise<Object>} - The updated message
 */
export const markMessageAsRead = async (messageId, userId) => {
    try {
        const message = await Message.findByIdAndUpdate(
            messageId,
            { readBy: userId },
            { new: true }
        );
        
        if (!message) {
            throw new Error('Message not found');
        }
        
        return message;
    } catch (error) {
        throw new Error(`Error marking message as read: ${error.message}`);
    }
};

/**
 * Get unread messages count for a user in a conversation
 * @param {String} conversationId - The conversation ID
 * @param {String} userId - The user ID
 * @returns {Promise<Number>} - Count of unread messages
 */
export const getUnreadMessagesCount = async (conversationId, userId) => {
    try {
        const count = await Message.countDocuments({
            conversation: conversationId,
            sender: { $ne: userId },
            readBy: { $ne: userId },
            isDeleted: false
        });
        
        return count;
    } catch (error) {
        throw new Error(`Error getting unread messages count: ${error.message}`);
    }
};

/**
 * Soft delete a message
 * @param {String} messageId - The message ID
 * @returns {Promise<Object>} - The deleted message
 */
export const deleteMessage = async (messageId) => {
    try {
        const message = await Message.findByIdAndUpdate(
            messageId,
            { 
                isDeleted: true,
                deletedAt: new Date()
            },
            { new: true }
        );
        
        if (!message) {
            throw new Error('Message not found');
        }
        
        return message;
    } catch (error) {
        throw new Error(`Error deleting message: ${error.message}`);
    }
};