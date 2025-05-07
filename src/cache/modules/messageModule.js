import { client } from "../client/redisClient.js";

const MESSAGE_KEY = (conversationId) => `messages:${conversationId}`

export const cacheMessage = async (conversationId, message) => {
    try {
        await client.rPush(MESSAGE_KEY(conversationId), JSON.stringify(message));
        await client.lTrim(key, -100, -1);

        // Get list length to determine TTL
        const listLength = await client.lLen(MESSAGE_KEY(conversationId));

        // Set TTL - 1 hour if over 100 messages, 24 hours otherwise
        const ttl = listLength > 100 ? 3600 : 86400;
        await client.expire(MESSAGE_KEY(conversationId), ttl);

    } catch (error) {
        console.error('Error caching message:', error);
        throw error;
    }
}

export const getCachedMessages = async (conversationId, limit = 50, skip = 0, fetchFn = null) => {
    try {
        const key = getMessageKey(conversationId);
        let messages = await redisClient.lRange(key, -(limit + skip), -1 - skip);

        if (messages.length === 0) {
            messages = await fetchFn(conversationId, limit, skip);
            const pipeline = redisClient.pipeline();
            for (const msg of [...messages].reverse()) {
                pipeline.rPush(MESSAGE_KEY(conversationId), JSON.stringify(msg));
            }
            await pipeline.exec();
            const ttl = skip > 100 ? 3600 : 86400;
            await client.expire(MESSAGE_KEY(conversationId), ttl);
            return messages;
        }

        return messages.map(JSON.parse);
    } catch (error) {
        console.error('Error getting cached messages:', error);
        throw error;
    }
}