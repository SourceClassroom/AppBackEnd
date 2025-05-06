import mongoose from "mongoose";

const { Schema } = mongoose;

const userBlockSchema = new Schema({
    blocker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, {timestamps: true});


const UserBlock = mongoose.model("UserBlock", userBlockSchema);

export { UserBlock }