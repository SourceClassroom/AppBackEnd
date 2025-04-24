import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const messageSchema = new Schema({
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    readBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ...softDeleteFields
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export { Message }