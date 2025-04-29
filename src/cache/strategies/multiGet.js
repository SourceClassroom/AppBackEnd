import { client } from "../client/redisClient.js";

export default async (ids, prefix, fetchFn) => {
    if (!ids || ids.length === 0) return [];

    const mappedIds = ids.map(id => `${prefix}:${id._id || id}`);

    const cachedData = await client.mget(mappedIds);

    const result = [];
    const missingData = [];

    cachedData.forEach((data, index) => {
        if (data !== null && data !== 'null') {
            try {
                result.push(JSON.parse(data));
            } catch (e) {
                console.error(`Redis parse error for key ${mappedIds[index]}:`, e);
                missingData.push(ids[index]);
            }
        } else {
            missingData.push(ids[index]);
        }
    });

    if (missingData.length > 0) {
        const fetchedDataFromDb = await fetchFn(missingData);

        const pipeline = client.multi();

        for (const data of fetchedDataFromDb) {
            const key = `${prefix}:${data.id || data._id}`; // Her iki olasılığı da kapsa
            pipeline.set(key, JSON.stringify(data), 'EX', 3600);
            result.push(data);
        }

        await pipeline.exec();
    }

    return result;
};
