import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, enum: [
            'new_assignment',
            'assignment_graded',
            'new_announcement',
            'new_material',
            'new_comment',
            'assignment_due_reminder',
            'submission_reminder'
        ] },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export { Notification }