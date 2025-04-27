import { Queue } from "bullmq";
import { client } from "../../cache/client/redisClient.js";

const notificationQueue = new Queue('notificationQueue',
    {
        connection: client,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true
        }
    });

export default notificationQueue;