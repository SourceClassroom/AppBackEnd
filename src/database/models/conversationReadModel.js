import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationReadSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    lastReadMessage: { type: Schema.Types.ObjectId, ref: "Message" }
});

const ConversationRead = mongoose.model("ConversationRead", conversationReadSchema);

export { ConversationRead }