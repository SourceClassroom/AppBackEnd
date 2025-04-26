import { client } from '../client/redisClient.js';

const getOrSetCache = async (key, fetchFn, ttl = 60) => {
    try {
        const cached = await client.get(key);
        if (cached) return JSON.parse(cached);

        const freshData = await fetchFn();
        if (freshData) {
            await client.set(key, JSON.stringify(freshData), "EX", ttl);
        }

        return freshData;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export default getOrSetCache;
