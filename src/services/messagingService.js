import * as redisPubSubService from "./redisPubSubService.js";
import { publishSocketEvent } from "../cache/socket/socketPubSub.js";

//Queues
import messageQueue from "../queue/queues/messageQueue.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";

//Cache Modules
import * as messageCacheModule from "../cache/modules/messageModule.js";
import * as conversationCacheModule from "../cache/modules/conversationModule.js";

//Database Modules
import * as userDatabaseModule from "../database/modules/userModule.js";
import * as messageDatabaseModule from "../database/modules/messageModule.js";
import * as conversationDatabaseModule from "../database/modules/conversationModule.js";

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
        if (!conversation) throw new Error("Konuşma bulunamadı");
        if (conversation.isPending) throw new Error("Bu konuşma onay bekliyor.");

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

        return { status: "queued" };
    } catch (error) {
        throw new Error(`Mesaj kuyruğa eklenirken hata oluştu: ${error.message}`);
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
        throw new Error(`Mesaj okundu olarak işaretlenirken hata oluştu: ${error.message}`);
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
        const conversationData = await conversationCacheModule.getCachedConversation(conversationId, conversationDatabaseModule.getConversationById)
        const participantIds = conversationData.participants.map(p => p._id.toString());

        await publishSocketEvent("typing_indicator", {
            conversationId,
            userId,
            isTyping,
            participantIds
        })

        return true;

    } catch (error) {
        throw new Error(`Yazma göstergesi gönderilirken hata oluştu: ${error.message}`);
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
        const conversationData = await conversationCacheModule.getCachedConversation(conversationId, conversationDatabaseModule.getConversationById)
        const messageData = await messageCacheModule.getCachedMessages(
            conversationId,
            limit,
            skip,
            messageDatabaseModule.getConversationMessages
        );

        const participantIds = conversationData.participants.map(p => p._id.toString());
        const participantsData = await multiGet(participantIds, "user", userDatabaseModule.getMultiUserById);

        return messageData.map(message => ({
            ...message,
            sender: participantsData.find(p => p._id.toString() === message.sender.toString())
        }));

    } catch (error) {
        throw new Error(`Konuşma mesajları alınırken hata oluştu: ${error.message}`);
    }
};