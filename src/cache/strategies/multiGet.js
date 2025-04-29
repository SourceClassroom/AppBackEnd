import { client } from "../client/redisClient.js";

export default async (ids, prefix, fetchFn) => {
    if (!ids || ids.length === 0) return [];
    const mappedIds = ids.map(id => `${prefix}:${id._id || id}`);

    const cachedData = await client.mget(mappedIds);

    const result = [];
    const missingData = [];

    cachedData.forEach((data, index) => {
        if (data) {
            result.push(JSON.parse(data));
        } else {
            missingData.push(ids[index]);
        }
    });

    if (missingData.length > 0) {
        const fetchedDataFromDb = await fetchFn(missingData);

        const pipeline = client.multi();

        for (const data of fetchedDataFromDb) {
            pipeline.set(`${prefix}:${data.id}`, JSON.stringify(data), 'EX', 3600);
            result.push(data);
        }

        await pipeline.exec();
    }
    return result;
};
