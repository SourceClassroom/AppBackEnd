import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const commentSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    ...softDeleteFields
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

export { Comment }