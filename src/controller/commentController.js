import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKeys, invalidateKey} from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as commentCacheHandler from "../cache/handlers/commentCacheHandler.js";

//Database Repositories
import *as userDatabaseRepository from "../database/repositories/userRepository.js";
import *as postDatabaseRepository from "../database/repositories/postRepository.js";
import *as commentDatabaseRepository from "../database/repositories/commentRepository.js";

export const createComment = async (req, res) => {
    try {
        const { postId, content } = req.body

        const commentData = {
            post: postId,
            content: content,
            author: req.user.id
        }

        const newComment = await commentDatabaseRepository.createComment(commentData)
        await postDatabaseRepository.pushCommentToPost(postId, newComment._id)
        await invalidateKeys([`comments:${postId}`, `post:${postId}`])

        res.status(201).json(ApiResponse.success("Comment created successfully", newComment, 201))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Internal Server Error", error))
    }
}

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        // Cache üzerinden veya DB'den yorumları al
        let comments = await commentCacheHandler.getPostComments(postId, commentDatabaseRepository.getPostComments);

        if (!comments || comments.length === 0) {
            return res.status(404).json(ApiResponse.notFound("Yorum bulunamadı"));
        }

        // Saf objeye dönüştür
        comments = comments.map(comment => comment.toObject ? comment.toObject() : comment);

        const users = comments.map(comment => comment.author);

        let userData = await multiGet(users, "user", userDatabaseRepository.getMultiUserById);
        userData = userData.map(user => user.toObject ? user.toObject() : user);

        // Kullanıcı bilgilerini yorumlara entegre et
        const result = comments.map(comment => {
            const user = userData.find(u => u._id.toString() === comment.author.toString());
            return {
                ...comment,
                author: {
                    _id: user._id,
                    name: user?.name || "Bilinmiyor",
                    surname: user?.surname || "",
                    profile: {
                        avatar: user?.profile?.avatar || null
                    }
                }
            };
        });

        res.status(200).json(ApiResponse.success("Yorumlar başarıyla getirildi", result, 200));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Internal Server Error", error));
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params

        const comment = await commentDatabaseRepository.deleteComment(commentId, req.user.id)
        if (!comment) {
            return res.status(404).json(ApiResponse.notFound("Yorum bulunamadı"))
        }

        await invalidateKey(`comments:${comment.post}`)

        res.status(200).json(ApiResponse.success("Yorum başarıyla silindi", null, 200))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Internal Server Error", error))
    }
}