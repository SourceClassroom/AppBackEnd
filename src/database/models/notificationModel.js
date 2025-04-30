import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Class"},
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, enum: [
            'new_assignment',
            'assignment_graded',
            'new_post',
            'new_material',
            'new_comment',
            'new_lesson',
            'assignment_due_reminder',
            'submission_reminder',
            'lesson_reminder'
        ] },
    isRead: { type: Boolean, default: false },
    expireAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", notificationSchema);

export { Notification }