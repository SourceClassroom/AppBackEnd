import { client } from '../client/redisClient.js'

async function setTTL(key, seconds) {
    return await client.expire(key, seconds);
}

async function getTTL(key) {
    return await client.ttl(key);
}

module.exports = { setTTL, getTTL };
