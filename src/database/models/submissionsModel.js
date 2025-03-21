import mongoose from "mongoose";

const { Schema } = mongoose;

const submissionSchema = new Schema({
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, required: true },
    files: [{ type: String }],
    grade: { type: Number },
});

const Submission = mongoose.model("Submission", submissionSchema);

export { Submission }