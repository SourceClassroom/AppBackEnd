const redis = require('../client/redis');

export const invalidateKey = async (key) => {
    return await redis.del(key);
}

export const invalidateKeys = async (keys = []) => {
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
}
