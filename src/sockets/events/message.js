import { v4 as uuidv4 } from "uuid";
import * as messagingService from "../../services/messagingService.js";

export async function handleSendMessage(socket, data) {
    const userId = socket.userId;

    const { conversationId, content, attachments } = data;

    if (!conversationId || (!content && (!attachments || attachments.length === 0))) {
        return socket.emit("error", { message: "Missing required fields" });
    }

    const clientMessageId = uuidv4(); // Benzersiz mesaj ID'si

    try {
        const message = await messagingService.sendMessage(
            conversationId,
            userId,
            content || 'Attachment',
            attachments || [],
            clientMessageId
        );
        socket.emit("message_sent", { message });
    } catch (err) {
        console.error("send_message error:", err.message);
        socket.emit("error", { message: err.message });
    }
}

export async function handleMarkRead(socket, data) {
    const userId = socket.userId;

    const { messageId, conversationId } = data;

    if (!messageId) {
        return socket.emit("error", { message: "Missing message ID" });
    }

    if (!conversationId) {
        return socket.emit("error", { message: "Missing conversation ID" });
    }

    try {
        await messagingService.markAsRead(userId, conversationId, messageId);
    } catch (err) {
        console.error("mark_read error:", err.message);
        socket.emit("error", { message: err.message });
    }
}