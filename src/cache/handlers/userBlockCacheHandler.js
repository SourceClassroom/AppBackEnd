import { client } from "../client/redisClient.js";

export const addBlock = async (blockerId, blockedId) => {
    await client.sadd(`block:${blockerId}`, blockedId);
};

export const removeBlock = async (blockerId, blockedId) => {
    await client.srem(`block:${blockerId}`, blockedId);
};

export const isBlockedBetween = async (userA, userB, fetchFn) => {
    const [aBlocksB, bBlocksA] = await Promise.all([
        client.sismember(`block:${userA}`, userB),
        client.sismember(`block:${userB}`, userA),
    ]);

    if (aBlocksB || bBlocksA) return true;

    const block = await fetchFn(userA, userB)

    if (block) {
        await client.sadd(`block:${block.blocker.toString()}`, block.blocked.toString());
        return true;
    }

    return false;
};

export const hasUserBlocked = async (blockerId, blockedId, fetchFn) => {
    const inCache = await client.sismember(`block:${blockerId}`, blockedId);
    if (inCache) return true;

    const result = await fetchFn(blockerId, blockedId);
    if (result) {
        await client.sadd(`block:${blockerId}`, blockedId);
        return true;
    }

    return false;
}