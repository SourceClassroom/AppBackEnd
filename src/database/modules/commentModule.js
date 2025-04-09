import {Comment} from "../models/commentModel.js";

export const createComment = async (commentData) => {
    try {
        return await Comment.create(commentData)
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getPostComments = async (postId) => {
    try {
        return await Comment.find({post: postId})
            .select("content")
            .populate("author", "name surname profile.avatar")
            .sort({createdAt: -1})
    } catch (error) {
        console.error(error)
        throw error
    }
}