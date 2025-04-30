import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const lessonSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    week: { type: Schema.Types.ObjectId, ref: 'Week' },
    title: { type: String, required: true },
    description: { type: String},
    joinUrl: { type: String, required: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'ended', 'started'], default: 'pending' },
    ...softDeleteFields
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export { Lesson }