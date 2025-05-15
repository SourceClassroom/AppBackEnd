import { publishSocketEvent } from "../cache/redisSocketPubSub/socketPubSub.js";

//Queues
import messageQueue from "../queue/queues/messageQueue.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import setWithTtl from "../cache/strategies/setWithTtl.js";

//Cache Handlers
import * as messageCacheHandler from "../cache/handlers/messageCacheHandler.js";
import * as conversationCacheHandler from "../cache/handlers/conversationCacheHandler.js";
import * as conversationReadCacheHandler from "../cache/handlers/conversationReadCacheHandler.js";

//Database Repositories
import * as userDatabaseRepository from "../database/repositories/userRepository.js";
import * as messageDatabaseRepository from "../database/repositories/messageRepository.js";
import * as conversationDatabaseRepository from "../database/repositories/conversationRepository.js";
import * as conversationReadDatabaseRepository from "../database/repositories/conversationReadRepository.js";

/**
 * Send a message to a conversation
 * @param {String} conversationId - The conversation ID
 * @param {String} senderId - The sender user ID
 * @param {String} content - The message content
 * @param {Array} attachments - Array of attachment IDs (optional)
 * @returns {Promise<Object>} - The created message
 */
export const sendMessage = async (conversationId, senderId, content, attachments = [], clientMessageId) => {
    try {
        const conversation = await conversationCacheHandler.getCachedConversation(
            conversationId,
            conversationDatabaseRepository.getConversationById
        );

        if (!conversation) throw new Error("Konuşma bulunamadı");
        if (conversation.isPending && conversation.lastMessage) throw new Error("Bu konuşma onay bekliyor.");

        const recipientIds = conversation.participants
            .filter(p => {
                // Handle both ObjectId and string formats
                const participantId = typeof p === 'object' ? p._id.toString() : p;
                return participantId !== senderId;
            })
            .map(p => typeof p === 'object' ? p._id.toString() : p);

        // Mesaj işini kuyruğa at
        await messageQueue.add("create_message", {
            conversationId,
            senderId,
            content,
            attachments,
            recipientIds,
            clientMessageId
        });

        return { status: "queued" };
    } catch (error) {
        throw new Error(`Mesaj kuyruğa eklenirken hata oluştu: ${error.message}`);
    }
};

/**
 * Mark a message as read
 * @param {String} messageId - The message ID
 * @param conversationId - The conversation ID
 * @param {String} userId - The user ID who read the message
 * @returns {Promise<Object>} - The updated message
 */
export const markAsRead = async (userId, conversationId, messageId) => {
    try {
        const readStatus = await conversationDatabaseRepository.updateUserReadStatus(userId, conversationId, messageId);
        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById);

        const participantIds = conversation.participants
            .filter(p => (typeof p === 'object' ? p._id.toString() : p) !== userId)
            .map(p => typeof p === 'object' ? p._id.toString() : p);

        let readStatusArray;
        const existingReadStatus = await conversationReadCacheHandler.getCachedReadStatus(conversationId, conversationReadDatabaseRepository.getReadStatus);

        if (existingReadStatus && typeof existingReadStatus === 'string') {
            readStatusArray = JSON.parse(existingReadStatus);
        } else if (existingReadStatus) {
            readStatusArray = existingReadStatus;
        } else {
            readStatusArray = [];
        }

        const userIndex = readStatusArray.findIndex(status => status.userId === userId);

        // Güncellenecek veri
        const updatedStatus = {
            lastReadMessage: messageId,
            updatedAt: new Date().toISOString(),
        };

        if (userIndex >= 0) {
            readStatusArray[userIndex] = {...readStatusArray[userIndex], ...updatedStatus};
        } else {
            readStatusArray.push({userId, conversationId, ...updatedStatus});
        }

        await setWithTtl(`readStatus:${conversationId}`, readStatusArray, 86400);

        await publishSocketEvent("message_read_update", {
            recipients: participantIds,
            readBy: userId,
            messageId,
            conversationId
        });

        return conversationDatabaseRepository;
    } catch (error) {
        console.error(error);
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
        const conversationData = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        const participantIds = conversationData.participants
            .filter(p => {
                // Handle both ObjectId and string formats
                const participantId = typeof p === 'object' ? p._id.toString() : p;
                return participantId !== userId;
            })
            .map(p => typeof p === 'object' ? p._id.toString() : p);

        await publishSocketEvent("typing_indicator", {
            conversationId,
            participants: participantIds,
            userId,
            isTyping
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
export const getConversationMessages = async (conversationId, limit = 100, skip = 0) => {
    try {
        const [conversationData, messageData] = await Promise.all([
            conversationCacheHandler.getCachedConversation(
                conversationId,
                conversationDatabaseRepository.getConversationById
            ),
            messageCacheHandler.getCachedMessages(
                conversationId,
                limit,
                skip,
                messageDatabaseRepository.getConversationMessages
            )
        ]);

        const participantIds = conversationData.participants.map(p => p.toString());
        const participantsData = await multiGet(participantIds, "user", userDatabaseRepository.getMultiUserById);

        // Create a map for faster lookups
        const participantsMap = new Map(
            participantsData.map(p => [p._id.toString(), p])
        );

        return messageData.map(message => {
            const sender = participantsMap.get(message.sender.toString());
            if (!sender) return message;

            return {
                ...message,
                sender: {
                    _id: sender._id,
                    name: sender.name,
                    surname: sender.surname,
                    profile: {
                        avatar: sender.profile?.avatar
                    }
                }
            };
        });

    } catch (error) {
        throw new Error(`Konuşma mesajları alınırken hata oluştu: ${error.message}`);
    }
};