import mongoose from "mongoose";

const { Schema } = mongoose;

const attachmentSchema = new Schema({
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        filename: {
            type: String,
            required: true,
        },
        originalname: {
            type: String,
            required: true,
        },
        mimetype: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
}, { timestamps: true });

const Attachment = mongoose.model("Attachment", attachmentSchema);

export { Attachment }