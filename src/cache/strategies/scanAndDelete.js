import { client } from "../client/redisClient.js";

export default async (pattern) => {
    try {
        const allKeysToDelete = new Set();

        const patternArray = Array.isArray(pattern) ? pattern : [pattern];

        for (const pattern of patternArray) {
            let cursor = "0";

            do {
                // Scan result can be array or object with reply property
                const scanResult = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
                const result = Array.isArray(scanResult) ? scanResult : scanResult.reply;
                if (!Array.isArray(result)) {
                    await client.del(pattern);
                    return 1;
                }
                const [nextCursor, keys] = result;
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
            if (chunk.length > 0) {
                await client.del(chunk);
            }
        }

        return keysToDelete.length;
    } catch (error) {
        console.error("scanAndDeleteByPattern error:", error);
        throw error;
    }
}