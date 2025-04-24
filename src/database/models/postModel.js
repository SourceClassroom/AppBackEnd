import mongoose from "mongoose";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const postSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    week: { type: Schema.Types.ObjectId, ref: "Week" },
    ...softDeleteFields
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

export { Post }