import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const weekSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
    materials: [{ type: Schema.Types.ObjectId, ref: "Material" }],
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    ...softDeleteFields
});

const Week = mongoose.model("Week", weekSchema);

export { Week }