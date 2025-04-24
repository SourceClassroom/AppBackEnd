import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as commentCacheModule from "../cache/modules/commentModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
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
        const { postId } = req.params;

        // Cache üzerinden veya DB'den yorumları al
        let comments = await commentCacheModule.getPostComments(postId, commentDatabaseModule.getPostComments);

        if (!comments || comments.length === 0) {
            return res.status(404).json(ApiResponse.notFound("Yorum bulunamadı", null, 404));
        }

        // Saf objeye dönüştür
        comments = comments.map(comment => comment.toObject ? comment.toObject() : comment);

        const users = comments.map(comment => comment.author);

        let userData = await multiGet(users, "user", userDatabaseModule.getMultiUserById);
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

        const comment = await commentDatabaseModule.getCommentById(commentId)
        if (!comment) {
            return res.status(404).json(ApiResponse.notFound("Yorum bulunamadı", null, 404))
        }

        await invalidateKey(`comments:${comment.post}`)
        await commentDatabaseModule.deleteComment(commentId)

        res.status(200).json(ApiResponse.success("Yorum başarıyla silindi", null, 200))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Internal Server Error", error))
    }
}