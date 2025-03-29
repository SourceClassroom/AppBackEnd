import {client} from "../redis/redisClient.js";

export const writeToCache = async (key, value, ttl) => {
    try {
        const valueJson = JSON.stringify(value)

        return await client.setEx(key, ttl, valueJson)
    } catch (error) {
        return error
    }
}

export const getFromCache = async (key) => {
    try {
        return JSON.parse(await client.get(key))
    } catch (error) {
        return error
    }
}

export const clearClassCache = async (classId) => {
    try {
        const keysToDelete = [];
        const pattern = `class:${classId}:*`; // Pattern for caches to delete

        // Find all keys efficiently
        const scanAndDelete = async (cursor = 0) => {
            // Handle different Redis client implementations
            let nextCursor;
            let foundKeys;

            try {
                // For redis@4.x and newer
                const reply = await client.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100
                });
                nextCursor = reply.cursor;
                foundKeys = reply.keys;
            } catch (err) {
                // For older redis versions or ioredis
                const reply = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);

                // Handle different return formats
                if (Array.isArray(reply)) {
                    [nextCursor, foundKeys] = reply;
                } else if (reply && typeof reply === 'object') {
                    nextCursor = reply.cursor || 0;
                    foundKeys = reply.keys || [];
                }
            }

            if (foundKeys && foundKeys.length > 0) {
                keysToDelete.push(...foundKeys);
            }

            // Continue if there are more keys
            if (nextCursor && nextCursor !== 0 && nextCursor !== "0") {
                await scanAndDelete(nextCursor);
            }
        };

        await scanAndDelete();

        // Delete found keys
        if (keysToDelete.length > 0) {
            // Handle large key sets by chunking if needed
            if (keysToDelete.length > 100) {
                // Delete in chunks of 100
                for (let i = 0; i < keysToDelete.length; i += 100) {
                    const chunk = keysToDelete.slice(i, i + 100);
                    await client.del(chunk);
                }
            } else {
                await client.del(keysToDelete);
            }
        }

        return keysToDelete.length; // Return number of deleted keys
    } catch (err) {
        console.error("Cache clearing error:", err);
        throw err; // Rethrow to allow handling by caller
    }
};