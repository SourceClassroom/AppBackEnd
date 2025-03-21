import mongoose from "mongoose";

const { Schema } = mongoose;

const materialModel = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true },
    description: { type: String },
    files: [{ type: String }],
}, { timestamps: true });

const Material = mongoose.model("Material", materialModel);

export { Material }