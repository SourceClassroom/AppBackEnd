import mongoose from "mongoose";

const { Schema } = mongoose;

const assignmentSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    submissions: [{ type: Schema.Types.ObjectId, ref: "Submission" }],
    week: { type: Schema.Types.ObjectId, ref: "Week" },
    fileTypes: [{ type: String, default: "all"}]
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export { Assignment }