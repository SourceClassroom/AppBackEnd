import { getSocketServer } from "../sockets/socketInstance.js";
import { getUserSockets } from "../cache/modules/onlineUserModule.js";
import * as messageModule from "../database/modules/messageModule.js";
import * as messageCacheModule from "../cache/modules/messageModule.js";
import * as redisPubSubService from "./redisPubSubService.js";

//Queues
import messageQueue from "../queue/queues/messageQueue.js";

//Cache Modules
import *as conversationCacheModule from "../cache/modules/conversationModule.js";

//Database Modules
import *as conversationDatabaseModule from "../database/modules/conversationModule.js";

/**
 * Send a message to a conversation
 * @param {String} conversationId - The conversation ID
 * @param {String} senderId - The sender user ID
 * @param {String} content - The message content
 * @param {Array} attachments - Array of attachment IDs (optional)
 * @returns {Promise<Object>} - The created message
 */
export const sendMessage = async (conversationId, senderId, content, attachments = []) => {
    try {
        const conversation = await conversationCacheModule.getCachedConversation(
            conversationId,
            conversationDatabaseModule.getConversationById
        );
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.isPending) throw new Error("This conversation is waiting for approval.");

        const recipientIds = conversation.participants
            .filter(p => !p._id.equals(senderId))
            .map(p => p._id.toString());

        // Mesaj işini kuyruğa at
        await messageQueue.add("create_message", {
            conversationId,
            senderId,
            content,
            attachments,
            recipientIds
        });

        return { status: "queued" }; // Anında yanıt dön, işlem arkada yapılacak
    } catch (error) {
        throw new Error(`Error queuing message: ${error.message}`);
    }
};

/**
 * Mark a message as read
 * @param {String} messageId - The message ID
 * @param {String} userId - The user ID who read the message
 * @returns {Promise<Object>} - The updated message
 */
export const markAsRead = async (messageId, userId) => {
    try {
        // Update the message in the database
        const message = await messageModule.markMessageAsRead(messageId, userId);

        // Update the message in Redis cache
        await messageCacheModule.updateCachedMessage(messageId, {
            readBy: userId,
            updatedAt: message.updatedAt
        });

        // Use Redis pub/sub to notify the sender
        await redisPubSubService.publishMessageRead(
            messageId,
            userId,
            message.conversation.toString(),
            message.sender.toString()
        );

        return message;
    } catch (error) {
        throw new Error(`Error marking message as read: ${error.message}`);
    }
};

/**
 * Send typing indicator to conversation participants
 * @param {String} conversationId - The conversation ID
 * @param {String} userId - The user ID who is typing
 * @param {Boolean} isTyping - Whether the user is typing or stopped typing
 */
export const sendTypingIndicator = async (conversationId, userId, isTyping) => {
    try {
        // Get the conversation to find participants
        const conversation = await conversationModule.getConversationById(conversationId);

        // Notify all participants except the sender
        const recipientIds = conversation.participants
            .filter(participant => participant._id.toString() !== userId)
            .map(participant => participant._id.toString());

        // Use Redis pub/sub to notify recipients
        await redisPubSubService.publishTypingIndicator(
            conversationId,
            userId,
            isTyping,
            recipientIds
        );
    } catch (error) {
        throw new Error(`Error sending typing indicator: ${error.message}`);
    }
};

/**
 * Get messages for a conversation with Redis caching
 * @param {String} conversationId - The conversation ID
 * @param {Number} limit - Number of messages to retrieve (default: 50)
 * @param {Number} skip - Number of messages to skip (for pagination)
 * @returns {Promise<Array>} - Array of messages
 */
export const getConversationMessages = async (conversationId, limit = 50, skip = 0) => {
    try {
        // Try to get messages from Redis cache first
        const cachedMessages = await messageCacheModule.getCachedConversationMessages(
            conversationId,
            limit,
            skip
        );

        // If messages are in cache, return them
        if (cachedMessages && cachedMessages.length > 0) {
            return cachedMessages;
        }

        // If not in cache, get from database
        const messages = await messageModule.getConversationMessages(
            conversationId,
            limit,
            skip
        );

        // Cache each message
        for (const message of messages) {
            await messageCacheModule.cacheMessage(message);
        }

        return messages;
    } catch (error) {
        throw new Error(`Error getting conversation messages: ${error.message}`);
    }
};

/**
 * Delete a message with cache invalidation
 * @param {String} messageId - The message ID
 * @returns {Promise<Object>} - The deleted message
 */
export const deleteMessage = async (messageId) => {
    try {
        // Delete from database
        const message = await messageModule.deleteMessage(messageId);

        // Update in Redis cache (mark as deleted)
        await messageCacheModule.updateCachedMessage(messageId, {
            isDeleted: true,
            updatedAt: message.updatedAt
        });

        return message;
    } catch (error) {
        throw new Error(`Error deleting message: ${error.message}`);
    }
};

/**
 * Notify users via sockets.io (legacy method, kept for backward compatibility)
 * @param {Array} userIds - Array of user IDs to notify
 * @param {String} event - The event name
 * @param {Object} data - The data to send
 */
export const notifyUsers = async (userIds, event, data) => {
    try {
        const io = getSocketServer();

        // For each user, get their sockets IDs and emit the event
        for (const userId of userIds) {
            const socketIds = await getUserSockets(userId);

            for (const socketId of socketIds) {
                io.to(socketId).emit(event, data);
            }
        }
    } catch (error) {
        console.error(`Error notifying users: ${error.message}`);
    }
};