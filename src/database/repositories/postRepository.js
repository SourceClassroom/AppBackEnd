import { Post } from '../models/postModel.js'

export const createPost = async (postData) => {
    try {
         return await Post.create(postData);
    } catch (error) {
        throw new Error('Post oluşturulurken bir hata meydana geldi.');
    }
}

export const getPostById = async (postId) => {
    try {
        return await Post.findById(postId)
    } catch (error) {
        throw new Error('Post getirilirken bir hata meydana geldi.');
    }
}

export const updatePost = async (postId, updateData) => {
    try {
        return await Post.findByIdAndUpdate(postId, updateData, { new: true });
    } catch (error) {
        throw new Error('Post güncellenirken bir hata meydana geldi.');
    }
}

export const pushCommentToPost = async (postId, commentId) => {
    try {
        return await Post.findByIdAndUpdate(postId, { $push: { comments: commentId } }, { new: true });
    } catch (error) {
        throw new Error('Post güncellenirken bir hata meydana geldi.');
    }
}

export const getMultiPosts = async (postIds) => {
    try {
        return await Post.find({ _id: { $in: postIds }, isDeleted: false }).sort({ createdAt: -1 })
            .populate({
                path: "attachments",
                select: "originalname size"
            })
            .sort({ createdAt: -1 })
    } catch (error) {
        throw new Error('Postlar getirilirken bir hata meydana geldi.');
    }
}

export const deletePost = async (postId, deletedBy) => {
    try {
        return await Post.findByIdAndUpdate(postId, { isDeleted: true, deletedBy, deletedAt: new Date()}, { new: true });
    } catch (error) {
        throw new Error('Post güncellenirken bir hata meydana geldi.');
    }
}