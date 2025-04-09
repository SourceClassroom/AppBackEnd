import { client } from '../client/redisClient.js'

export const invalidateKey = async (key) => {
    try {
        return await client.del(key);
    } catch (error) {
        console.error('Cache invalidation error:', error);
        throw new Error("Redis cache silinirken hata oluştu");
    }

}

export const invalidateKeys = async (keys = []) => {
    try {
        const validKeys = keys.filter(key => typeof key === 'string' && key.trim() !== '');
        if (validKeys.length === 0) return 0;

        return await client.del(...validKeys);
    } catch (error) {
        console.error('Cache invalidation error:', error);
        throw new Error("Redis cache silinirken hata oluştu");
    }
};
