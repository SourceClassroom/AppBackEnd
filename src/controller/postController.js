import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKeys, invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Module
import *as postCacheModule from '../cache/modules/postModule.js';
import *as weekCacheModule from '../cache/modules/weekModule.js';
import *as classCacheModule from '../cache/modules/classModule.js';

//Database Module
import *as postDatabaseModule from '../database/modules/postModule.js';
import *as weekDatabaseModule from '../database/modules/weekModule.js';
import *as classDatabaseModule from '../database/modules/classModule.js';

export const createPost = async (req, res) => {
    try {
        const { classId, content, week, title } = req.body;
        req.body.permission = 1

        const fileIds = await processMedia(req);

        const classCacheKey = `class:${classId}:posts`;
        const weekCacheKey = `week:${week}:posts`;

        const newPostData = {
            classroom: classId,
            author: req.user.id,
            title,
            content,
            attachments: fileIds,
            week
        }

        const createPost = await postDatabaseModule.createPost(newPostData)
        if (week) {
            await weekDatabaseModule.pushPostToWeek(week, createPost._id)
            await invalidateKeys([weekCacheKey])
        } else {
            await classDatabaseModule.pushPostToClass(classId, createPost._id)
            await invalidateKeys([classCacheKey])
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

        const classPosts = await classCacheModule.getCachedClassPosts(classId, classDatabaseModule.getClassPosts)

        const postData = await multiGet(classPosts, "post", postDatabaseModule.getMultiPosts)

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

        const weekPosts = await weekCacheModule.getCachedWeekPosts(weekId, weekDatabaseModule.getWeekPosts)

        const postData = await multiGet(weekPosts, "post", postDatabaseModule.getMultiPosts)

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

        const updatedPost = await postDatabaseModule.updatePost(postId, { content, title });
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

        const deletedPost = await postDatabaseModule.deletePost(postId);
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