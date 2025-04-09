import { client } from "../client/redisClient.js";
import getOrSet from "../strategies/getOrSet.js";

const USER_KEY = (userId) => `user:${userId}`

export const getCachedUserData = async (userId, fetchFn) => {
    try {
        return await getOrSet(USER_KEY(userId), () => fetchFn(userId), 3600)
    } catch (error) {
        throw error;
    }
}