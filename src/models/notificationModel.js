import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, enum: ["new_post", "new_assignment", "new_comment", "direct_message"] },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export { Notification }