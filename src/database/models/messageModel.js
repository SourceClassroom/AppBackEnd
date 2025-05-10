import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema({
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    clientMessageId: { type: String }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ clientMessageId: 1 }, { unique: true, sparse: true });

const Message = mongoose.model("Message", messageSchema);

export { Message }