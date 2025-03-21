import mongoose from "mongoose";

const { Schema } = mongoose;

const assignmentSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    attachments: [{ type: String }],
    submissions: [{ type: Schema.Types.ObjectId, ref: "Submission" }],
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export { Assignment }