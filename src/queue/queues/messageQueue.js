import { Queue } from "bullmq";
import { client } from "../../cache/client/redisClient.js";

const messageQueue = new Queue("messageQueue",
    {
    connection: client,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        }
    }
});

export default messageQueue;