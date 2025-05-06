import { client } from "../client/redisClient.js";

// Key prefixes
const MESSAGE_KEY_PREFIX = "message:";
const CONVERSATION_MESSAGES_KEY_PREFIX = "conversation:messages:";

// TTL for cached messages (in seconds)
const MESSAGE_CACHE_TTL = 60 * 60 * 24; // 24 hours

/**
 * Cache a message in Redis
 * @param {Object} message - The message object to cache
 * @returns {Promise<Boolean>} - True if successful
 */
export const cacheMessage = async (message) => {
    try {
        const messageKey = `${MESSAGE_KEY_PREFIX}${message._id}`;
        
        // Convert message object to a flat hash structure
        // We need to stringify nested objects and arrays
        const messageHash = {
            _id: message._id.toString(),
            conversation: message.conversation.toString(),
            sender: typeof message.sender === 'object' && message.sender._id 
                ? message.sender._id.toString() 
                : message.sender.toString(),
            content: message.content,
            attachments: JSON.stringify(message.attachments || []),
            readBy: message.readBy ? message.readBy.toString() : '',
            createdAt: message.createdAt ? message.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: message.updatedAt ? message.updatedAt.toISOString() : new Date().toISOString(),
            isDeleted: message.isDeleted ? '1' : '0'
        };
        
        // If sender is populated, store the sender details
        if (typeof message.sender === 'object' && message.sender.name) {
            messageHash.senderName = message.sender.name;
            messageHash.senderEmail = message.sender.email || '';
            messageHash.senderProfilePicture = message.sender.profilePicture || '';
        }
        
        // Store the message in Redis
        await client.hset(messageKey, messageHash);
        
        // Set TTL for the message
        await client.expire(messageKey, MESSAGE_CACHE_TTL);
        
        // Add message ID to the conversation's message list
        const conversationMessagesKey = `${CONVERSATION_MESSAGES_KEY_PREFIX}${message.conversation}`;
        await client.zadd(conversationMessagesKey, 
            // Use timestamp as score for sorting
            new Date(message.createdAt).getTime(), 
            message._id.toString()
        );
        
        // Set TTL for the conversation's message list
        await client.expire(conversationMessagesKey, MESSAGE_CACHE_TTL);
        
        return true;
    } catch (error) {
        console.error(`Error caching message ${message._id}:`, error);
        return false;
    }
};

/**
 * Get a message from Redis cache
 * @param {String} messageId - The message ID
 * @returns {Promise<Object|null>} - The message object or null if not found
 */
export const getCachedMessage = async (messageId) => {
    try {
        const messageKey = `${MESSAGE_KEY_PREFIX}${messageId}`;
        
        // Check if message exists in cache
        const exists = await client.exists(messageKey);
        if (!exists) {
            return null;
        }
        
        // Get message from cache
        const messageHash = await client.hgetall(messageKey);
        if (!messageHash || Object.keys(messageHash).length === 0) {
            return null;
        }
        
        // Parse the message hash into a message object
        const message = {
            _id: messageHash._id,
            conversation: messageHash.conversation,
            content: messageHash.content,
            attachments: JSON.parse(messageHash.attachments || '[]'),
            readBy: messageHash.readBy || null,
            createdAt: new Date(messageHash.createdAt),
            updatedAt: new Date(messageHash.updatedAt),
            isDeleted: messageHash.isDeleted === '1'
        };
        
        // Handle sender information
        if (messageHash.senderName) {
            message.sender = {
                _id: messageHash.sender,
                name: messageHash.senderName,
                email: messageHash.senderEmail,
                profilePicture: messageHash.senderProfilePicture
            };
        } else {
            message.sender = messageHash.sender;
        }
        
        return message;
    } catch (error) {
        console.error(`Error getting cached message ${messageId}:`, error);
        return null;
    }
};

/**
 * Get messages for a conversation from Redis cache
 * @param {String} conversationId - The conversation ID
 * @param {Number} limit - Number of messages to retrieve
 * @param {Number} skip - Number of messages to skip (for pagination)
 * @returns {Promise<Array|null>} - Array of messages or null if not found
 */
export const getCachedConversationMessages = async (conversationId, limit = 50, skip = 0) => {
    try {
        const conversationMessagesKey = `${CONVERSATION_MESSAGES_KEY_PREFIX}${conversationId}`;
        
        // Check if conversation messages exist in cache
        const count = await client.zcard(conversationMessagesKey);
        if (count === 0) {
            return null;
        }
        
        // Get message IDs from the sorted set (newest first)
        const messageIds = await client.zrevrange(
            conversationMessagesKey,
            skip,
            skip + limit - 1
        );
        
        if (!messageIds || messageIds.length === 0) {
            return [];
        }
        
        // Get each message from cache
        const messages = await Promise.all(
            messageIds.map(messageId => getCachedMessage(messageId))
        );
        
        // Filter out any null messages (in case some were evicted from cache)
        return messages.filter(message => message !== null);
    } catch (error) {
        console.error(`Error getting cached conversation messages for ${conversationId}:`, error);
        return null;
    }
};

/**
 * Update a message in Redis cache
 * @param {String} messageId - The message ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Boolean>} - True if successful
 */
export const updateCachedMessage = async (messageId, updates) => {
    try {
        const messageKey = `${MESSAGE_KEY_PREFIX}${messageId}`;
        
        // Check if message exists in cache
        const exists = await client.exists(messageKey);
        if (!exists) {
            return false;
        }
        
        // Prepare updates
        const updateHash = {};
        
        if (updates.readBy) {
            updateHash.readBy = updates.readBy.toString();
        }
        
        if (updates.isDeleted !== undefined) {
            updateHash.isDeleted = updates.isDeleted ? '1' : '0';
        }
        
        if (updates.content) {
            updateHash.content = updates.content;
        }
        
        if (updates.updatedAt) {
            updateHash.updatedAt = updates.updatedAt.toISOString();
        } else {
            updateHash.updatedAt = new Date().toISOString();
        }
        
        // Update message in cache
        await client.hset(messageKey, updateHash);
        
        // Reset TTL
        await client.expire(messageKey, MESSAGE_CACHE_TTL);
        
        return true;
    } catch (error) {
        console.error(`Error updating cached message ${messageId}:`, error);
        return false;
    }
};

/**
 * Delete a message from Redis cache
 * @param {String} messageId - The message ID
 * @returns {Promise<Boolean>} - True if successful
 */
export const deleteCachedMessage = async (messageId) => {
    try {
        const messageKey = `${MESSAGE_KEY_PREFIX}${messageId}`;
        
        // Get the conversation ID before deleting
        const conversationId = await client.hget(messageKey, 'conversation');
        
        // Delete the message
        await client.del(messageKey);
        
        // Remove from conversation messages list if we have the conversation ID
        if (conversationId) {
            const conversationMessagesKey = `${CONVERSATION_MESSAGES_KEY_PREFIX}${conversationId}`;
            await client.zrem(conversationMessagesKey, messageId);
        }
        
        return true;
    } catch (error) {
        console.error(`Error deleting cached message ${messageId}:`, error);
        return false;
    }
};

/**
 * Delete all cached messages for a conversation
 * @param {String} conversationId - The conversation ID
 * @returns {Promise<Boolean>} - True if successful
 */
export const deleteCachedConversationMessages = async (conversationId) => {
    try {
        const conversationMessagesKey = `${CONVERSATION_MESSAGES_KEY_PREFIX}${conversationId}`;
        
        // Get all message IDs for the conversation
        const messageIds = await client.zrange(conversationMessagesKey, 0, -1);
        
        // Delete each message
        if (messageIds && messageIds.length > 0) {
            const messageKeys = messageIds.map(id => `${MESSAGE_KEY_PREFIX}${id}`);
            await client.del(...messageKeys);
        }
        
        // Delete the conversation messages list
        await client.del(conversationMessagesKey);
        
        return true;
    } catch (error) {
        console.error(`Error deleting cached conversation messages for ${conversationId}:`, error);
        return false;
    }
};