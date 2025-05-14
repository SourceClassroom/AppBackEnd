import { client } from "../client/redisClient.js";
import broadcastUpdate from "./broadcastUpdate.js";
import { getUserSockets } from "../handlers/onlineUserCacheHandler.js";
import { getSocketServer } from "../../sockets/socketInstance.js";


const pub = client;
const sub = client.duplicate();

const CHANNEL = "socket_events";

// PUB
export async function publishSocketEvent(eventName, data) {
    await pub.publish(CHANNEL, JSON.stringify({ eventName, data }));
}

// SUB
export async function startSocketSubscriber() {
    await sub.subscribe(CHANNEL);

    sub.on("message", async (channel, msg) => {
        try {
            if (!msg) {
                console.error("Redis Subscriber Error: Received null or empty message");
                return;
            }

            const parsedMsg = JSON.parse(msg);

            if (!parsedMsg || !parsedMsg.eventName) {
                console.error("Redis Subscriber Error: Invalid message format", msg);
                return;
            }

            const { eventName, data } = parsedMsg;

            const io = getSocketServer();

            if (eventName === "new_message") {
                const { message, conversationId, recipients } = data;

                await broadcastUpdate("new_message", recipients, message, io)

            } else if (eventName === "typing_indicator") {
                const { conversationId, participants, userId, isTyping } = data;

                await broadcastUpdate("typing_indicator", participants, {conversationId, userId, isTyping}, io)

            } else if (eventName === "message_status_update") {
                const { recipientId, messageId, status, timestamp,error } = data;

                const socketIds = await getUserSockets(recipientId);
                socketIds.forEach(socketId => {
                    io.to(socketId).emit("message_status_update", { messageId, status, timestamp, error });
                });
            } else if (eventName === "online_status") {
                const { userId, status } = data;

                const socketIds = await getUserSockets(userId);
                socketIds.forEach(socketId => {
                    io.to(socketId).emit("online_status", { userId, status });
                });
            } else if (eventName === "message_read_update") {
                const { recipients, readBy, messageId, conversationId } = data;

                await broadcastUpdate("message_read_update", recipients, {readBy, messageId, conversationId}, io)
            }

        } catch (err) {
            console.error("Redis Subscriber Error:", err.message);
        }
    });
}
