import { client } from "../client/redisClient.js";

export const cacheUserAccessToken = async (userId, keyData) => {
    try {
        return await client.set(
            `user:${userId}:access_token`,
            keyData.access_token,
            'EX',
            keyData.expires_in
        )
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