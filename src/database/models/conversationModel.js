import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const conversationSchema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, required: true },
    lastMessage: { type: Schema.Types.ObjectId },
    ...softDeleteFields
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export { Conversation }