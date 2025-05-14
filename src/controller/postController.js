import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKeys, invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as weekCacheHandler from '../cache/handlers/weekCacheHandler.js';
import *as classCacheHandler from '../cache/handlers/classCacheHandler.js';

//Database Repositories
import *as postDatabaseRepository from '../database/repositories/postRepository.js';
import *as weekDatabaseRepository from '../database/repositories/weekRepository.js';
import *as classDatabaseRepository from '../database/repositories/classRepository.js';

//Notification
import notifyClassroom from "../notifications/notifyClassroom.js";

export const createPost = async (req, res) => {
    try {
        const { classId, content, week, title } = req.body;
        req.body.permission = 1

        const fileIds = await processMedia(req);

        const classCacheKey = `class:${classId}:posts`;
        const weekCacheKey = `week:${week}:posts`;

        const classroom = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)

        const newPostData = {
            classroom: classId,
            author: req.user.id,
            title,
            content,
            attachments: fileIds,
            week
        }

        const createPost = await postDatabaseRepository.createPost(newPostData)
        if (week) {
            await weekDatabaseRepository.pushPostToWeek(week, createPost._id)
            await invalidateKeys([weekCacheKey])
        } else {
            await classDatabaseRepository.pushPostToClass(classId, createPost._id)
            await invalidateKeys([classCacheKey])
        }

        const notificationData = {
            type: "new_post",
            classId,
            subject: `${classroom.title} sıfında yeni bir duyuru yapıldı.`,
            classTitle: classroom.title,
            message: `${content.slice(0, 30)}...` ,
            path: `${process.env.FRONTEND_URL}/class/${classId}/announcements`,
            actionText: "Duyuruya git",
        }

        notifyClassroom(classId, notificationData)

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

        const classPosts = await classCacheHandler.getCachedClassPosts(classId, classDatabaseRepository.getClassPosts)

        const postData = await multiGet(classPosts, "post", postDatabaseRepository.getMultiPosts)

        return res.status(200).json(ApiResponse.success("Sınıf post verisi.", postData));
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

        const weekPosts = await weekCacheHandler.getCachedWeekPosts(weekId, weekDatabaseRepository.getWeekPosts)

        const postData = await multiGet(weekPosts, "post", postDatabaseRepository.getMultiPosts)

        return res.status(200).json(ApiResponse.success("Hafta post verisi.", postData));
    } catch (error) {
        console.error('Hafta post fetch hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta post verisi alinirken bir hata meydana geldi.', error)
        );
    }
}

export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, title } = req.body;

        const updatedPost = await postDatabaseRepository.updatePost(postId, { content, title });
        if (!updatedPost) {
            return res.status(404).json(ApiResponse.notFound('Post bulunamadı.'));
        }

        if (updatedPost.week) await invalidateKey(`week:${updatedPost.week}:posts`)
        else await invalidateKey(`class:${updatedPost.classroom}:posts`)

        res.status(200).json(ApiResponse.success('Post başarıyla güncellendi.', updatedPost));
    } catch (error) {
        console.error('Post güncelleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Post güncellenirken bir hata meydana geldi.', error)
        );
    }
}

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deletedPost = await postDatabaseRepository.deletePost(postId, req.user.id);
        if (!deletedPost) {
            return res.status(404).json(ApiResponse.notFound('Post bulunamadı.'));
        }

        await invalidateKey(`post:${postId}`)

        res.status(200).json(ApiResponse.success('Post başarıyla silindi.', deletedPost));
    } catch (error) {
        console.error('Post silme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Post silinirken bir hata meydana geldi.', error)
        );
    }
}