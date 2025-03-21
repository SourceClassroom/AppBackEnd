import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

export { Comment }