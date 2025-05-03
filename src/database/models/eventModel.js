import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const eventSchema = new Schema({
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    type: { type: String, enum: ['lesson', 'assignment_due', 'exam', 'other'], required: true },
    visibility: { type: String, enum: ['class', 'user'], required: true },
    metadata: {
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        tags: [{type: String, maxLength: 6}],
        color: {type: String, default: '#2b7fff'}
    },
    ...softDeleteFields
}, {timestamps: true});

const Event = mongoose.model("Event", eventSchema);

export { Event }