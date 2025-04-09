import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import { invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Modules
import *as commentCacheModule from "../cache/modules/commentModule.js";

//Database Modules
import *as postDatabaseModule from "../database/modules/postModule.js";
import *as commentDatabaseModule from "../database/modules/commentModule.js";

export const createComment = async (req, res) => {
    try {
        const { postId, content } = req.body

        const commentData = {
            post: postId,
            content: content,
            author: req.user.id
        }

        const newComment = await commentDatabaseModule.createComment(commentData)
        await postDatabaseModule.pushCommentToPost(postId, newComment._id)
        await invalidateKey(`comments:${postId}`)

        res.status(201).json(ApiResponse.success("Comment created successfully", newComment, 201))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Internal Server Error", error))
    }
}

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params

        const comments = await commentCacheModule.getPostComments(postId, commentDatabaseModule.getPostComments)
        if (!comments) {
            return res.status(404).json(ApiResponse.notFound("Yorum bulunamadı", null, 404))
        }

        res.status(200).json(ApiResponse.success("Yorumlar başarıyla getirildi", comments, 200))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Internal Server Error", error))
    }
}