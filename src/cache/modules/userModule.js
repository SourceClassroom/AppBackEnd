import getOrSet from "../strategies/getOrSet.js";
import { client } from "../client/redisClient.js";

const USER_KEY = (userId) => `user:${userId}`

export const getCachedUserData = async (userId, fetchFn) => {
    try {
        return await getOrSet(USER_KEY(userId), () => fetchFn(userId), 3600)
    } catch (error) {
        console.log(error)
        return error
    }
}