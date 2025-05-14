import {getUserSockets} from "../handlers/onlineUserCacheHandler.js";

export default async (emit, recipients, data, io) => {
    try {
        // Get all redisSocketPubSub IDs in parallel
        const socketPromises = recipients.map(userId => getUserSockets(userId));
        const allSocketIds = await Promise.all(socketPromises);

        // Flatten and remove duplicate redisSocketPubSub IDs
        const uniqueSocketIds = [...new Set(allSocketIds.flat())];
        // Emit to all sockets at once
        if (uniqueSocketIds.length > 0) {
            io.to(uniqueSocketIds).emit(emit, data);
        }

        return uniqueSocketIds.length; // Track how many users received the update
    } catch (error) {
        console.error("Broadcast error:", error);
        throw error;
    }
}