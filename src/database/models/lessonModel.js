import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const lessonSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: 'Class' },
    week: { type: Schema.Types.ObjectId, ref: 'Week' },
    title: { type: String, required: true },
    description: { type: String},
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    startDate: { type: Date, required: true },
    ...softDeleteFields
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export { Lesson }