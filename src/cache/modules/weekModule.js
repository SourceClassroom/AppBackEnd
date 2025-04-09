import getOrSet from "../strategies/getOrSet.js";
import { client } from "../client/redisClient.js";

const WEEK_KEY = (weekId) => `week:${weekId}`

export const getCachedWeekData = async (weekId, fetchFn) => {
    try {
        return await getOrSet(WEEK_KEY(weekId), () => fetchFn(weekId), 3600)
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getCachedWeekPosts = async (weekId, fetchFn) => {
    try {
        return await getOrSet(`${WEEK_KEY(weekId)}:posts`, () => fetchFn(weekId), 3600)
    } catch (error) {
        throw error;
    }
}
