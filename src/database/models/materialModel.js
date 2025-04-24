import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const materialModel = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    description: { type: String },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    week: { type: Schema.Types.ObjectId, ref: "Week" },
    ...softDeleteFields
}, { timestamps: true });

const Material = mongoose.model("Material", materialModel);

export { Material }