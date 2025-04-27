import { Queue } from "bullmq";
import { client } from "../../cache/client/redisClient.js";

const notificationQueue = new Queue('notificationQueue', {
    connection: client
});

export default notificationQueue;