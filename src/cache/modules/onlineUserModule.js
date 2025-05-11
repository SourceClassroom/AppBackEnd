import { client } from "../client/redisClient.js";

const SOCKETS_PREFIX = "sockets:";

export const addUserSocket = async (userId, socketId) => {
    if (!userId || !socketId) {
        throw new Error("addUserSocket: userId and socketId are required.");
    }
    const key = `${SOCKETS_PREFIX}${userId}`;
    await client.sadd(key, socketId);
    await client.expire(key, 24 * 60 * 60); // 24 hours in seconds
}

export const getUserSockets = async (userId) => {
    if (!userId) {
        throw new Error("getUserSockets: userId is required.");
    }

    return await client.smembers(`${SOCKETS_PREFIX}${userId}`);
}

export const removeUserSocket = async (userId, socketId) => {
    if (!userId || !socketId) {
        throw new Error("removeUserSocket: userId and socketId are required.");
    }

    await client.srem(`${SOCKETS_PREFIX}${userId}`, socketId);
}

export const removeAllUserSockets = async (userId) => {
    if (!userId) {
        throw new Error("removeAllUserSockets: userId is required.");
    }

    await client.del(`${SOCKETS_PREFIX}${userId}`);
}