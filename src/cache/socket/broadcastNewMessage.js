import {getUserSockets} from "../modules/onlineUserModule.js";

export default async (recipients, message, conversationId, io) => {
    try {
        // Tüm socket ID'leri parallel olarak al
        const socketPromises = recipients.map(userId => getUserSockets(userId));
        const allSocketIds = await Promise.all(socketPromises);

        // Düzleştir ve tekrar eden socket ID'leri temizle
        const uniqueSocketIds = [...new Set(allSocketIds.flat())];

        // Tek seferde tüm socketlere emit
        if (uniqueSocketIds.length > 0) {
            io.to(uniqueSocketIds).emit("new_message", { message, conversationId });
        }

        return uniqueSocketIds.length; // Kaç kullanıcıya gönderildiğini takip için
    } catch (error) {
        console.error("Broadcast error:", error);
        throw error;
    }
}
