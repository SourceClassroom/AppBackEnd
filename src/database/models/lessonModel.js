import mongoose from "mongoose";

const { Schema } = mongoose;

const lessonSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: 'Class' },
    week: { type: Schema.Types.ObjectId, ref: 'Week' },
    title: { type: String, required: true },
    description: { type: String},
    zoomUrl: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export { Lesson }