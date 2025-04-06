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
        const { classId, content, week, title } = req.body;
        const fileIds = await processMedia(req);

        const classCacheKey = `class:${classId}`;
        const weekCacheKey = `week:${week}`;

        const newPostData = {
            classroom: classId,
            author: req.user.id,
            title,
            content,
            attachments: fileIds,
            week
        }

        const createPost = await Post.create(newPostData)
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

export const getClassPosts = async (req, res) => {
    try {
        const { classId } = req.params;
        const cacheKey = `class:${classId}:posts`;

        const getPostsFromCache = await cacheService.getFromCache(cacheKey);
        if (getPostsFromCache) {
            return res.status(200).json(ApiResponse.success("Sınıf post verisi.", getPostsFromCache));
        }

        const getPosts = await Class.findById(classId)
            .populate({
                path: "posts",
                populate: {
                    path: 'attachments',
                    select: '_id size originalname'
                },
                select: "title content attachments comments createdAt"
            })

        await cacheService.writeToCache(cacheKey, getPosts.posts, 3600);
        return res.status(200).json(ApiResponse.success("Sınıf post verisi.", getPosts.posts));
    } catch (error) {
        console.error('Class post fetch hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Class post verisi alinirken bir hata meydana geldi.', error)
        );
    }
}

export const getWeekPosts = async (req, res) => {
    try {
        const { weekId } = req.params;
        const cacheKey = `week:${weekId}:posts`;

        const getPostsFromCache = await cacheService.getFromCache(cacheKey);
        if (getPostsFromCache) {
            return res.status(200).json(ApiResponse.success("Sınıf post verisi.", getPostsFromCache));
        }

        const getPosts = await Week.findById(weekId)
            .populate({
                path: "posts",
                populate: {
                    path: 'attachments',
                    select: '_id size originalname'
                },
                select: "title content attachments comments createdAt"
            })

        await cacheService.writeToCache(cacheKey, getPosts.posts, 3600);
        return res.status(200).json(ApiResponse.success("Hafta post verisi.", getPosts.posts));
    } catch (error) {
        console.error('Hafta post fetch hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta post verisi alinirken bir hata meydana geldi.', error)
        );
    }
}

