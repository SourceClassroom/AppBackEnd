import getOrSet from "../strategies/getOrSet.js";

const READ_STATUS_CACHE_KEY = (conversationId) => `readStatus:${conversationId}`;

export const getCachedReadStatus = async (conversationId, fetchFn) => {
    try {
        return await getOrSet(READ_STATUS_CACHE_KEY(conversationId), () => fetchFn(conversationId), 86400);
    } catch (error) {
        console.error(error)
        throw error
    }
}