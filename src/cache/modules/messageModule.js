import { client } from "../client/redisClient.js";

const MESSAGE_KEY = (conversationId) => `messages:${conversationId}`

export const cacheMessage = async (conversationId, message) => {
    const key = MESSAGE_KEY(conversationId);
    const messageStr = JSON.stringify(message);

    try {
        const pipeline = client.pipeline();

        // Mevcut cache'i oku (son 100 mesaj varsa fazla performans düşürmez)
        const cachedMessages = await client.lrange(key, 0, -1);

        const isAlreadyCached = cachedMessages.some(m => {
            try {
                const parsed = JSON.parse(m);
                return parsed._id === message._id;
            } catch {
                return false;
            }
        });

        if (!isAlreadyCached) {
            // Eklenmemişse cache'e ekle
            pipeline.rpush(key, messageStr);
            pipeline.ltrim(key, -100, -1);
            pipeline.expire(key, cachedMessages.length > 100 ? 3600 : 86400);
            await pipeline.exec();
        } else {
            console.log(`Message ${message._id} is already cached. Skipping.`);
        }

    } catch (error) {
        console.error('Error caching message:', error);
        throw error;
    }
};

export const getCachedMessages = async (conversationId, limit = 50, skip = 0, fetchFn = null) => {
    try {
        const key = MESSAGE_KEY(conversationId);
        let messages = await client.lrange(key, -(limit + skip), -1 - skip);

        if (messages.length === 0) {
            messages = await fetchFn(conversationId, limit, skip);
            const pipeline = client.pipeline();
            for (const msg of [...messages].reverse()) {
                pipeline.rpush(MESSAGE_KEY(conversationId), JSON.stringify(msg));
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