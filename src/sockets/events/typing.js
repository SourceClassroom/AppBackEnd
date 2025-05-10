import * as messagingService from "../../services/messagingService.js";

export async function handleTyping(socket, data) {
    const userId = socket.userId;
    console.log(data)
    const { conversationId, isTyping } = data;

    if (!conversationId) {
        return socket.emit("error", { message: "Missing conversation ID" });
    }

    try {
        await messagingService.sendTypingIndicator(conversationId, userId, isTyping === true);
    } catch (err) {
        console.error("typing error:", err.message);
        socket.emit("error", { message: err.message });
    }
}
