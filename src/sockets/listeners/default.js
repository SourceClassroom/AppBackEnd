import { handleTyping } from "../events/typing.js";
import { handleSendMessage, handleMarkRead } from "../events/message.js";
import * as onlineUserCacheHandler from "../../cache/handlers/onlineUserCacheHandler.js";

export function registerSocketEvents(socket) {
    const userId = socket.userId;

    onlineUserCacheHandler.addUserSocket(userId, socket.id)
        .then(() => console.log(`User ${userId} set online.`))
        .catch((err) => console.error("Error setting user online:", err.message));

    socket.on("send_message", (data) => handleSendMessage(socket, data));
    socket.on("mark_read", (data) => handleMarkRead(socket, data));
    socket.on("typing", (data) => handleTyping(socket, data));

    socket.on("disconnect", () => {
        onlineUserCacheHandler.removeUserSocket(userId, socket.id)
            .then(() => console.log(`User ${userId} went offline.`))
            .catch((err) => console.error("Disconnect error:", err.message));
    });
}