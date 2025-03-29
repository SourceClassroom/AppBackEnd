import mongoose from "mongoose";

const { Schema } = mongoose;

const attachmentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    classroom: { type: Schema.Types.ObjectId, ref: 'Class' },
    filename: {type: String, required: true,},
    originalname: {type: String, required: true,},
    mimetype: {type: String, required: true,},
    path: {type: String, required: true,},
    size: {type: Number, required: true,},
    uploadDate: {type: Date, default: Date.now() },
    permission: {type: Number, default: 0}
});

const Attachment = mongoose.model("Attachment", attachmentSchema);

export { Attachment }