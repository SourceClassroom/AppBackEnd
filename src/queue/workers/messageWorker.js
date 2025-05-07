import { Worker } from "bullmq";
import { client } from "../../cache/client/redisClient.js";
import {cacheMessage} from "../../cache/modules/messageModule.js";
import { createMessage } from "../../database/modules/messageModule.js";
import { publishSocketEvent } from "../../cache/socket/socketPubSub.js";
import { updateLastMessage } from "../../database/modules/conversationModule.js";

new Worker("messageQueue", async job => {
    try {
        const { conversationId, senderId, content, attachments, recipientIds, clientMessageId } = job.data;

        let message = null;

        if (clientMessageId) {
            message = await Message.findOne({ clientMessageId });
            if (message) {
                console.log(`Duplicate message skipped (clientMessageId: ${clientMessageId})`);
            }
        }

        if (!message) {
            message = await createMessage(conversationId, senderId, content, attachments, clientMessageId);
        }

        // Use Promise.all to parallelize independent asynchronous operations
        await Promise.all([
            updateLastMessage(conversationId, message._id),
            cacheMessage(conversationId, message),
            publishSocketEvent("new_message", {
                message,
                conversationId,
                recipients: recipientIds
            })
        ]);

        await publishSocketEvent("message_status_update", {
            recipientId: senderId,
            messageId: message._id,
            status: "delivered",
            timestamp: message.createdAt
        });

    } catch (error) {
        console.error('Error processing message queue:', error);
        await publishSocketEvent("message_status_update", {
            recipientId: senderId,
            status: "failed",
            error: error.message || "Mesaj gönderilemedi"
        });
        throw error;
    }
}, {
    connection: client
});
