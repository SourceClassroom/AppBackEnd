import { client } from '../client/redisClient.js'

const getOrSetCache = async (key, fetchFn, ttl = 60) => {
    try {
        const cached = await client.get(key);
        if (cached) return JSON.parse(cached);

        const freshData = await fetchFn();
        if (freshData) await client.setEx(key, ttl, JSON.stringify(freshData));

        return freshData;
    } catch (error) {
        console.log(error)
        throw error
    }
}

export default getOrSetCache;
