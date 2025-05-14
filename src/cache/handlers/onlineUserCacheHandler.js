import { client } from "../client/redisClient.js";

const SOCKETS_PREFIX = "sockets:";

export const addUserSocket = async (userId, socketId) => {
    try {
        const key = `${SOCKETS_PREFIX}${userId}`;
        await client.sadd(key, socketId);
        await client.expire(key, 24 * 60 * 60); // 24 hours in seconds
    } catch (error) {
        throw new Error(`Kullanıcı soketi eklenemedi: ${error.message}`);
    }
}

export const getUserSockets = async (userId) => {
    try {
        return await client.smembers(`${SOCKETS_PREFIX}${userId}`);
    } catch (error) {
        throw new Error(`Kullanıcı soketleri alınamadı: ${error.message}`);
    }
}

export const removeUserSocket = async (userId, socketId) => {
    try {
        await client.srem(`${SOCKETS_PREFIX}${userId}`, socketId);
    } catch (error) {
        throw new Error(`Kullanıcı soketi silinemedi: ${error.message}`);
    }
}

export const removeAllUserSockets = async (userId) => {
    try {
        await client.del(`${SOCKETS_PREFIX}${userId}`);
    } catch (error) {
        throw new Error(`Tüm kullanıcı soketleri silinemedi: ${error.message}`);
    }
}
