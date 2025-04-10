import getOrSet from "../strategies/getOrSet.js";
import scanAndDelete from "../strategies/scanAndDelete.js";

const USER_KEY = (userId) => `user:${userId}`

export const getCachedUserData = async (userId, fetchFn) => {
    try {
        return await getOrSet(USER_KEY(userId), () => fetchFn(userId), 3600)
    } catch (error) {
        throw error;
    }
}

export const getCachedUserDashboardData = async (userId, fetchFn) => {
    try {
        return await getOrSet(`${USER_KEY(userId)}:dashboard`, () => fetchFn(userId), 3600)
    } catch (error) {
        throw error;
    }
}

export const clearUserCache = async (userId) => {
    try {
        const patterns = [`user:${userId}`, `user:${userId}:*`];
        return await scanAndDelete(patterns);
    } catch (error) {
        console.error(`clearUserCache error (userId: ${userId}):`, error);
        throw error;
    }
}

