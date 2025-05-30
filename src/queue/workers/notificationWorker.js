import { Worker } from "bullmq";
import { client } from "../../cache/client/redisClient.js";
import { getSocketServer } from "../../sockets/socketInstance.js";
import { invalidateKey } from "../../cache/strategies/invalidate.js"
import { getUserSockets } from "../../cache/handlers/onlineUserCacheHandler.js";
import { createNotification } from "../../database/repositories/notificationRepository.js";

const notificationWorker = new Worker("notificationQueue", async (job) => {
    const { userId, notificationData, allowPush } = job.data;
    // 1. Veritabanına kaydet
    const savedNotification = await createNotification(userId, notificationData);
    await invalidateKey(`user:${userId}:notifications`)
    // 2. Socket'e yolla
    if (allowPush) {
        const io = getSocketServer();
        const sockets = await getUserSockets(userId)
        if (sockets && sockets.length > 0) {
            sockets.forEach((socketId) => {
                //console.log(`Sending notification to sockets: ${socketId}`);
                io.to(socketId).emit("notification", savedNotification);
            });
        }
    }

}, { connection: client });

notificationWorker.on('completed', (job) => {
    console.log(`notificationWorker completed: ${job.id}`);
});

notificationWorker.on('failed', (job, err) => {
    console.error(`notificationWorker failed: ${job.id}`, err.message);
});


export default notificationWorker;
