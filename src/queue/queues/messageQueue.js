import { Queue } from "bullmq";
import { client } from "../../cache/client/redisClient.js";

const messageQueue = new Queue("messageQueue",
    {
    connection: client
});

export default messageQueue;
