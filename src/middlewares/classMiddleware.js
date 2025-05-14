import ApiResponse from "../utils/apiResponse.js";

//Cache Modules
import *as weekCacheHandler from "../cache/handlers/weekCacheHandler.js";
import *as postCacheHandler from "../cache/handlers/postCacheHandler.js";
import *as classCacheHandler from "../cache/handlers/classCacheHandler.js";
import *as lessonCacheHandler from "../cache/handlers/lessonCacheHandler.js";
import *as assignmentCacheHandler from "../cache/handlers/assignmentCacheHandler.js";

//Database Modules
import *as weekDatabaseRepository from "../database/repositories/weekRepository.js";
import *as postDatabaseRepository from "../database/repositories/postRepository.js";
import *as classDatabaseRepository from "../database/repositories/classRepository.js";
import *as lessonDatabaseRepository from "../database/repositories/lessonRepository.js";
import *as assignmentDatabaseRepository from "../database/repositories/assignmentRepository.js";


export const checkWeekClassroom = async (req, res, next) => {
    try {
        const weekId = req.params.weekId || req.body.weekId;
        if (!weekId) return res.status(400).json(ApiResponse.error("Hafta ID'si gerekli"))
        const classId = req.params.classId || req.body.classId;
        if (!classId) return res.status(400).json(ApiResponse.error("Sınıf ID'si gerekli"))

        const weekData = await weekCacheHandler.getCachedWeekData(weekId, weekDatabaseRepository.getWeekById)
        if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

        const classData = await classCacheHandler.getClassWeeks(classId, classDatabaseRepository.getWeeksByClassId)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (weekData.classroom !== classData._id && !classData.includes(weekData._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve hafta eşleşmedi"))
        }

        return next();
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bir hata oluştu", error))
    }
}

export const checkAssignmentClassroom = async (req, res, next) => {
    try {
        const assignmentId = req.params.assignmentId || req.body.assignmentId;
        if (!assignmentId) return res.status(400).json(ApiResponse.error("Ödev ID'si gerekli"))
        const classId = req.params.classId || req.body.classId;
        if (!classId) return res.status(400).json(ApiResponse.error("Sınıf ID'si gerekli"))
        const weekId = req.params.weekId || req.body.weekId;

        const assignmentData = await assignmentCacheHandler.getCachedAssignment(assignmentId, assignmentDatabaseRepository.getAssignmentById)
        if (!assignmentData) return res.status(404).json(ApiResponse.error("Ödev bulunamadı"))

        const classData = await classCacheHandler.getCachedClassAssignments(classId, classDatabaseRepository.getClassAssignments)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (assignmentData.classroom !== classData._id && !classData.includes(assignmentData._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve ödev eşleşmedi"))
        }

        if (assignmentData.week) {
            const weekData = await weekCacheHandler.getCachedWeekAssignments(assignmentData.week, weekDatabaseRepository.getWeekAssignments)
            if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

            if (assignmentData.week !== weekId || !weekData.includes(assignmentData._id)) {
                return res.status(403).json(ApiResponse.forbidden("Hafta ve ödev eşleşmedi"))
            }
        }

        return next();
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bir hata oluştu", error))
    }
}

export const checkPostClassroom = async (req, res, next) => {
    try {
        const postId = req.params.postId || req.body.postId;
        if (!postId) return res.status(400).json(ApiResponse.error("Post ID'si gerekli"))
        const classId = req.params.classId || req.body.classId;
        if (!classId) return res.status(400).json(ApiResponse.error("Sınıf ID'si gerekli"))
        const weekId = req.params.weekId || req.body.weekId;

        const post = await postCacheHandler.getCachedPost(postId, postDatabaseRepository.getPostById)
        if (!post) return res.status(404).json(ApiResponse.error("Post bulunamadı"))

        const classData = await classCacheHandler.getCachedClassPosts(classId, classDatabaseRepository.getClassPosts)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (post.classroom !== classData._id && !classData.includes(post._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve post eşleşmedi"))
        }

        if (post.week) {
            const weekData = await weekCacheHandler.getCachedWeekPosts(post.week, weekDatabaseRepository.getWeekPosts)
            if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

            if (post.week !== weekId || post.week !== weekData._id || !weekData.includes(post._id)) {
                return res.status(403).json(ApiResponse.forbidden("Hafta ve post eşleşmedi"))
            }
        }

        return next();
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bir hata oluştu", error))
    }
}

export const checkLessonClassroom = async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId || req.body.lessonId;
        if (!lessonId) return res.status(400).json(ApiResponse.error("Ders ID'si gerekli"))
        const classId = req.params.classId || req.body.classId;
        if (!classId) return res.status(400).json(ApiResponse.error("Sınıf ID'si gerekli"))
        const weekId = req.params.weekId || req.body.weekId;

        const lesson = await lessonCacheHandler.getCachedLessonData(lessonId, lessonDatabaseRepository.getLessonById)
        if (!lesson) return res.status(404).json(ApiResponse.error("Ders bulunamadı"))

        const classData = await classCacheHandler.getClassLessons(classId, classDatabaseRepository.getClassLessons)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (lesson.classroom !== classData._id && !classData.includes(lesson._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve ders eşleşmedi"))
        }

        if (lesson.week) {
            const weekData = await weekCacheHandler.getCachedWeekLessons(lesson.week, weekDatabaseRepository.getWeekLessons)
            if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

            if (lesson.week !== weekId || lesson.week !== weekData._id || !weekData.includes(lesson._id)) {
                return res.status(403).json(ApiResponse.forbidden("Hafta ve ders eşleşmedi"))
            }
        }

        return next();
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bir hata oluştu", error))
    }
}