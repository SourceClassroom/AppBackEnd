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

export const getCachedUserNotifications = async (userId, fetchFn) => {
    try {
        return await getOrSet(`${USER_KEY(userId)}:notifications`, () => fetchFn(userId), 3600)
    } catch (error) {
        throw error;
    }
}

export const clearUserCache = async (userId) => {
    try {
        return await scanAndDelete(USER_KEY(userId));
    } catch (error) {
        console.error(`clearUserCache error (userId: ${userId}):`, error);
        throw error;
    }
}

export const getUserCount = async (fetchFn) => {
    try {
        return await getOrSet('user:count', () => fetchFn(), 3600)
    } catch (error) {
        throw error;
    }
}
