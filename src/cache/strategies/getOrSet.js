import { client } from '../client/redisClient.js'

const getOrSetCache = async (key, fetchFn, ttl = 60) => {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const freshData = await fetchFn();
    if (freshData) await redis.setEx(key, ttl, JSON.stringify(freshData));

    return freshData;
}

export default getOrSetCache;
