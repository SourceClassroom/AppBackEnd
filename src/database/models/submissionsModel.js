import mongoose from "mongoose";

const { Schema } = mongoose;

const submissionSchema = new Schema({
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    grade: { type: Number },
    feedback: { type: String },
}, {timestamps: true});

const Submission = mongoose.model("Submission", submissionSchema);

export { Submission }