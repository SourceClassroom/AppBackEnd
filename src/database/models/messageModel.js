import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema({
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    readBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export { Message }