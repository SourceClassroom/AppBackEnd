import getOrSet from "../strategies/getOrSet.js";

const CONVERSATION_KEY = (conversationId) => `conversation:${conversationId}`

export const getCachedConversation = async (conversationId, fetchFn) => {
    try {
        return await getOrSet(CONVERSATION_KEY(conversationId), () => fetchFn(conversationId), 3600)
    } catch (error) {
        console.error(error)
        throw error
    }
};

export const getUserConversations = async (userId, fetchFn) => {
    try {
        return await getOrSet(`user:${userId}:conversations`, () => fetchFn(userId), 3600)
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getCachedReadStatus = async (conversationId, fetchFn) => {
    try {
        return await getOrSet(`readStatus:${conversationId}`, () => fetchFn(conversationId), 3600)
    } catch (error) {
        console.error(error);
        throw error;
    }
};