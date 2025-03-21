import mongoose from "mongoose";

const { Schema } = mongoose;

const postSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [{
        type: String,
    }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    week: { type: Schema.Types.ObjectId, ref: "Week" },
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

export { Post }