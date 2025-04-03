import ApiResponse from "../utils/ApiResponse.js";
import TokenService from "../services/jwtService.js";
import {User} from "../database/models/userModel.js";
import {Post} from "../database/models/postModel.js";
import {Class} from "../database/models/classModel.js";
import *as fileService from "../services/fileService.js";
import {processMedia} from "../services/fileService.js";
import *as cacheService from "../services/cacheService.js";
import {Week} from "../database/models/weekModel.js";

export const createPost = async (req, res) => {
    try {
        const { classId, content, week } = req.body;
        const fileIds = await processMedia(req);

        const classCacheKey = `class:${classId}`;
        const weekCacheKey = `week:${week}`;

        const newPostData = {
            classroom: classId,
            author: req.user.id,
            content,
            attachments: fileIds,
            week
        }

        const createPost = await Post.create(newPostData)
        //const updateClass = await Class.findByIdAndUpdate(classId, {$push: {posts: [createPost._id]}}, {new:true})
        if (week) {
            const updateWeek = await Week.findByIdAndUpdate(week, { $push: { posts: createPost._id } });
            await cacheService.writeToCache(weekCacheKey, updateWeek, 3600)
        } else {
            const updateClass = await Class.findByIdAndUpdate(classId, { $push: { posts: createPost._id } });
            await cacheService.writeToCache(classCacheKey, updateClass, 3600)

        }

        res.status(201).json(ApiResponse.success("Duyuru başarıyla oluşturuldu.", createPost, 201));
    } catch (error) {
        console.error('Post oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Post oluşturulurken bir hata meydana geldi.', error)
        );
    }
}