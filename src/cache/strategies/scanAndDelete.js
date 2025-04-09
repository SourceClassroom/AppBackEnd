import { client } from "../client/redisClient.js";

export default async (pattern) => {
    try {
        const allKeysToDelete = new Set();

        const patternArray = Array.isArray(patterns) ? patterns : [patterns];

        for (const pattern of patternArray) {
            let cursor = "0";

            do {
                const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
                cursor = nextCursor;

                if (Array.isArray(keys) && keys.length > 0) {
                    keys.forEach(k => allKeysToDelete.add(k));
                }
            } while (cursor !== "0");
        }

        const keysToDelete = Array.from(allKeysToDelete);
        const chunkSize = 100;

        for (let i = 0; i < keysToDelete.length; i += chunkSize) {
            const chunk = keysToDelete.slice(i, i + chunkSize);
            await client.del(...chunk);
        }

        return keysToDelete.length;
    } catch (error) {
        console.error("scanAndDeleteByPattern error:", error);
        throw error;
    }
}