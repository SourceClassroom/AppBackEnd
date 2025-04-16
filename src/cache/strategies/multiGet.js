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
    console.log(missingData)
    const fetcherDataFromDb = await fetchFn(missingData);

    for (const data of fetcherDataFromDb) {
        await client.set(`${prefix}:${data.id}`, JSON.stringify(user), {
            EX: 3600
        });
        result.push(data);
    }
    return result
}