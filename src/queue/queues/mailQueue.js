import { Queue } from "bullmq";
import { client } from "../../cache/client/redisClient.js";

const mailQueue = new Queue('mailQueue',
    {
        connection: client,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true
        }
    });

export default mailQueue;