import getOrSet from "../strategies/getOrSet.js";

export const getPostComments = async (postId, fetchFn) => {
    try {
        return await getOrSet(`comments:${postId}`, () => fetchFn(postId));
    } catch (error) {
        throw error
    }
}