import mongoose from "mongoose";

const { Schema } = mongoose;

const zoomSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refreshToken: {type: String, required: true}
}, {timestamps: true});

const Zoom = mongoose.model("Zoom", zoomSchema);

export { Zoom }