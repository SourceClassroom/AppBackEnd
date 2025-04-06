import getOrSet from "../strategies/getOrSet.js";
import { client } from "../client/redisClient.js";

const WEEK_KEY = (weekId) => `week:${weekId}`

export const getCachedWeekData = async (weekId, fetchFn) => {
    try {
        return await getOrSet(WEEK_KEY(weekId), () => fetchFn(weekId), 3600)
    } catch (error) {
        console.log(error)
        return error
    }
}