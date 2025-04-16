import { client } from "../client/redisClient.js";

export default async (ids, prefix, fetchFn) => {
    const mappedIds = ids.map(id => `${prefix}:${id}`);
    const cachedData = await client.mGet(mappedIds);

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
        const fetcherDataFromDb = await fetchFn(missingData);

        const pipeline = client.multi(); // Redis pipeline başlat

        for (const data of fetcherDataFromDb) {
            pipeline.set(`${prefix}:${data.id}`, JSON.stringify(data), {
                EX: 3600
            });
            result.push(data);
        }

        await pipeline.exec(); // Bütün set işlemlerini tek seferde gönder
    }

    return result;
};
