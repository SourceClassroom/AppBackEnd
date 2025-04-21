import { client } from "../client/redisClient.js";

export const cacheUserAccessToken = async (userId, keyData) => {
    try {
        return await client.setEx(`user:${userId}:access_token`, keyData.expires_in, keyData.access_token)
    } catch (error) {
        throw error
    }
}

export const getUserAccessToken = async (userId) => {
    try {
        return await client.get(`user:${userId}:access_token`)
    } catch (error) {
        throw error
    }
}