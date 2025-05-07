import { client } from "../client/client.js";
import { getSocketServer } from "../../sockets/socketInstance.js";
import { getUserSocketIds } from "../modules/onlineUserModule.js";

const pub = client;
const sub = client.duplicate();

await sub.connect(); // Eğer dışarıda zaten bağlanıyorsan burada değil

const CHANNEL = "socket_events";

// PUB
export async function publishSocketEvent(eventName, data) {
    await pub.publish(CHANNEL, JSON.stringify({ eventName, data }));
}

// SUB
export async function startSocketSubscriber() {
    await sub.subscribe(CHANNEL, async (msg) => {
        try {
            const { eventName, data } = JSON.parse(msg);

            if (eventName === "new_message") {
                const { message, conversationId, recipients } = data;

                const io = getSocketServer();
                for (const userId of recipients) {
                    const socketIds = await getUserSocketIds(userId);
                    socketIds.forEach(socketId => {
                        io.to(socketId).emit("new_message", { message, conversationId });
                    });
                }
            }
            else if (eventName === "typing_indicator") {
                const { conversationId, participants, userId, isTyping } = data;

                const io = getSocketServer();
                for (const participantId of participants) {
                    const socketIds = await getUserSocketIds(participantId);
                    socketIds.forEach(socketId => {
                        io.to(socketId).emit("typing_indicator", { conversationId, userId, isTyping });
                    });
                }
            }
        } catch (err) {
            console.error("Redis Subscriber Error:", err.message);
        }
    });
}