import { client } from "../client/redisClient.js"

export const getMultiCachedEvents = async (ids, fetchFn, range) => {
    try {
        const mappedIds = ids.map(id => `events:${id}:${range}`);
        const cachedEvents = await client.mget(mappedIds);
        const events = [];
        const keysToFetch = [];

        cachedEvents.forEach((event, index) => {
            if (event) {
                const parsedEvent = JSON.parse(event);
                if (Array.isArray(parsedEvent) && parsedEvent.length > 0) {
                    events.push(parsedEvent);
                }
            } else {
                keysToFetch.push(ids[index]);
            }
        });

        if (keysToFetch.length > 0) {
            const fetchedEventsMap = {};
            for (const id of keysToFetch) {
                const event = await fetchFn(id, range);
                if (Array.isArray(event) && event.length > 0) {
                    fetchedEventsMap[id] = event;
                    events.push(event);
                }
            }

            const pipeline = client.pipeline();
            for (const id in fetchedEventsMap) {
                pipeline.set(`events:${id}:${range}`, JSON.stringify(fetchedEventsMap[id]), 'EX', 86400);
            }
            await pipeline.exec();
        }

        return events;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

