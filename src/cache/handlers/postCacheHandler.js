import getOrSet from "../strategies/getOrSet.js";

const POST_KEY = (postId) => `post:${postId}`;

export const getCachedPost = async (postId, fetchFn) => {
    try {
        return await getOrSet(POST_KEY(postId), () => fetchFn(postId));
    } catch (error) {
        throw error;
    }
}