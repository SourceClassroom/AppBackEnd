import { client } from "../client/redisClient.js";

export default async (ids, prefix, fetchFn, expression = "") => {
    if (!ids || ids.length === 0) return [];

    const mappedIds = ids.map(idObj => {
        const id = idObj._id || idObj;
        return expression
            ? `${prefix}:${id}:${expression}` // class:<classId>:<expression>
            : `${prefix}:${id}`;              // class:<classId>
    });

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
            const id = data.id || data._id;
            const key = expression
                ? `${prefix}:${id}:${expression}`
                : `${prefix}:${id}`;

            pipeline.set(key, JSON.stringify(data), 'EX', 3600);
            result.push(data);
        }

        await pipeline.exec();
    }

    return result;
};
