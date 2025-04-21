import mongoose from "mongoose";

const { Schema } = mongoose;

const meetingSchema = new Schema({
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topic: {type: String, required: true},
    meetingId: {type: String, required: true},
    joinUrl: {type: String, required: true},
    startUrl: {type: String, required: true},
    startTime: {type: Date, required: true},
    duration: {type: Number, default: 60}
}, {timestamps: true});

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting }