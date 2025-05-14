import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const conversationSchema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupOwner:  { type: Schema.Types.ObjectId, ref: "User" },
    groupImage: { type: Schema.Types.ObjectId, ref: "Attachment" },
    mutedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPending: { type: Boolean, default: false },
    lastMessage: { type: Schema.Types.ObjectId },
    ...softDeleteFields
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export { Conversation }