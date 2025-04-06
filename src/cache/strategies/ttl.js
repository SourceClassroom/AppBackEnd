// cache/strategies/ttl.js
const redis = require('../client/redis');

async function setTTL(key, seconds) {
    return await redis.expire(key, seconds);
}

async function getTTL(key) {
    return await redis.ttl(key);
}

module.exports = { setTTL, getTTL };
