import { client } from "../client/redisClient.js"

export const getMultiCachedEvents = async (ids, fetchFn, range) => {
    try {
        const mappedIds = ids.map(id => `events:${id}:${range}`);
        const cachedEvents = await client.mget(mappedIds);
        const events = [];
        const keysToFetch = [];

        cachedEvents.forEach((event, index) => {
            if (event) {
                events.push(JSON.parse(event));
            } else {
                keysToFetch.push(ids[index]);
            }
        });

if (keysToFetch.length > 0) {
            const fetchedEvents = await fetchFn(keysToFetch);
            const pipeline = client.pipeline();
            fetchedEvents.forEach((event, index) => {
                events.push(event);
                pipeline.set(`events:${keysToFetch[index]}:${range}`, JSON.stringify(event));
            });
            await pipeline.exec();
        }
        return events;
    } catch (error) {
        console.error(error);
        throw error;
    }
}