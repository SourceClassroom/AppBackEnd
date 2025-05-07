import { Worker } from "bullmq";
import { client } from "../../cache/client/redisClient.js";
import {cacheMessage} from "../../cache/modules/messageModule.js";
import { createMessage } from "../../database/modules/messageModule.js";
import { publishSocketEvent } from "../../cache/socket/socketPubSub.js";
import { updateLastMessage } from "../../database/modules/conversationModule.js";

new Worker("messageQueue", async job => {
    const { conversationId, senderId, content, attachments, recipientIds } = job.data;

    const message = await createMessage(conversationId, senderId, content, attachments);

    await updateLastMessage(conversationId, message._id)
    await cacheMessage(conversationId, message)

    await publishSocketEvent("new_message", {
        message,
        conversationId,
        recipients: recipientIds
    });
}, {
    connection: client
});
