import { ConversationRead } from "../models/conversationReadModel.js";

export const getReadStatus = async (conversationId) => {
    try {
        const readStatus = await ConversationRead.find({ conversationId }).select("conversationId userId lastReadMessage updatedAt").lean();
        return readStatus ? readStatus : null;
    } catch (error) {
        throw new Error(`Error getting user read status: ${error.message}`);
    }
};