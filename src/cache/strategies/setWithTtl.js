import {client} from "../client/redisClient.js";

export default async (key, data, ttl) => {
    try {
        return await client.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
        throw error;
    }
}