import { client } from "../client/redisClient.js";

export default async (pattern) => {
    try {
        const allKeysToDelete = new Set();

        const patternArray = Array.isArray(pattern) ? pattern : [pattern];

        // Scan through patterns to collect keys
        for (const pattern of patternArray) {
            let cursor = "0";

            do {
                // Scan result can be array or object with reply property
                const scanResult = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
                const result = Array.isArray(scanResult) ? scanResult : scanResult.reply;
                if (!Array.isArray(result)) {
                    // Delete single key if scan result is not an array
                    const deleted = await client.del(pattern);
                    return deleted;
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
        let totalDeleted = 0;

        // Delete keys in chunks
        for (let i = 0; i < keysToDelete.length; i += chunkSize) {
            const chunk = keysToDelete.slice(i, i + chunkSize);
            if (chunk.length > 0) {
                const deleted = await client.del(chunk);
                totalDeleted += deleted;
            }
        }

        return totalDeleted;
    } catch (error) {
        console.error("scanAndDeleteByPattern error:", error);
        throw error;
    }
}