import { Queue } from "bullmq";
import { client } from "../../cache/client/redisClient.js";

const mailQueue = new Queue('mailQueue', {
    connection: client
});

export default mailQueue;