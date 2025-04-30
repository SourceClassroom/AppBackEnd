import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const ClassSchema = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: [32, "Max length is exceeded"]
    },
    description: { type: String },
    code: {
        type: String,
        required: true,
        unique: true
    },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    forbiddenStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
    material: [{ type: Schema.Types.ObjectId, ref: "Material" }],
    lessons: [{type: Schema.Types.ObjectId, ref: "Lesson"}],
    weeks: [{ type: Schema.Types.ObjectId, ref: "Week" }],
    ...softDeleteFields
}, { timestamps: true });

const Class = mongoose.model('Class', ClassSchema)

export { Class }