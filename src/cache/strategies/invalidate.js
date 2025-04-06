import { client } from '../client/redisClient.js'

export const invalidateKey = async (key) => {
    return await client.del(key);
}

export const invalidateKeys = async (keys = []) => {
    if (keys.length === 0) return 0;
    return await client.del(...keys);
}
