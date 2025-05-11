import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationReadSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    lastReadMessage: { type: Schema.Types.ObjectId, ref: "Message" }
});

const ConversationRead = mongoose.model("ConversationRead", conversationReadSchema);

export { ConversationRead }