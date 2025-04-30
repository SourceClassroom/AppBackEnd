import ApiResponse from "../utils/apiResponse.js";

//Cache Modules
import *as weekCacheModule from "../cache/modules/weekModule.js";
import *as postCacheModule from "../cache/modules/postModule.js";
import *as classCacheModule from "../cache/modules/classModule.js";
import *as assignmentCacheModule from "../cache/modules/assignmentModule.js";

//Database Modules
import *as weekDatabseModule from "../database/modules/weekModule.js";
import *as postDatabaseModule from "../database/modules/postModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";
import *as assignmentDatabaseModule from "../database/modules/assignmentModule.js";

export const checkWeekClassroom = async (req, res, next) => {
    try {
        const weekId = req.params.weekId || req.body.weekId;
        if (!weekId) return res.status(400).json(ApiResponse.error("Hafta ID'si gerekli"))
        const classId = req.params.classId || req.body.classId;
        if (!classId) return res.status(400).json(ApiResponse.error("Sınıf ID'si gerekli"))

        const weekData = await weekCacheModule.getCachedWeekData(weekId, weekDatabseModule.getWeekById)
        if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

        const classData = await classCacheModule.getCachedClassData(classId, classDatabaseModule.getClassById)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (weekData.classroom !== classData._id && !classData.weeks.includes(weekData._id)) {
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

        const assignmentData = await assignmentCacheModule.getCachedAssignment(assignmentId, assignmentDatabaseModule.getAssignmentById)
        if (!assignmentData) return res.status(404).json(ApiResponse.error("Ödev bulunamadı"))

        const classData = await classCacheModule.getCachedClassData(classId, classDatabaseModule.getClassById)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (assignmentData.classroom !== classData._id && !classData.assignments.includes(assignmentData._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve ödev eşleşmedi"))
        }

        if (assignmentData.week) {
            const weekData = await weekCacheModule.getCachedWeekAssignments(assignmentData.week, weekDatabseModule.getWeekAssignments)
            if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

            if (assignmentData.week !== weekId || !weekData.assignments.includes(assignmentData._id)) {
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

        const post = await postCacheModule.getCachedPost(postId, postDatabaseModule.getPostById)
        if (!post) return res.status(404).json(ApiResponse.error("Post bulunamadı"))

        const classData = await classCacheModule.getCachedClassData(classId, classDatabaseModule.getClassById)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (post.classroom !== classData._id && !classData.posts.includes(post._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve post eşleşmedi"))
        }

        if (post.week) {
            const weekData = await weekCacheModule.getCachedWeekData(post.week, weekDatabseModule.getWeekById)
            if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

            if (post.week !== weekId || post.week !== weekData._id || !weekData.posts.includes(post._id)) {
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

        const lesson = await lessonCacheModule.getCachedLesson(lessonId, lessonDatabaseModule.getLessonById)
        if (!lesson) return res.status(404).json(ApiResponse.error("Ders bulunamadı"))

        const classData = await classCacheModule.getCachedClassData(classId, classDatabaseModule.getClassById)
        if (!classData) return res.status(404).json(ApiResponse.error("Sınıf bulunamadı"))

        if (lesson.classroom !== classData._id && !classData.lessons.includes(lesson._id)) {
            return res.status(403).json(ApiResponse.forbidden("Sınıf ve ders eşleşmedi"))
        }

        if (lesson.week) {
            const weekData = await weekCacheModule.getCachedWeekData(lesson.week, weekDatabseModule.getWeekById)
            if (!weekData) return res.status(404).json(ApiResponse.error("Hafta bulunamadı"))

            if (lesson.week !== weekId || lesson.week !== weekData._id || !weekData.lessons.includes(lesson._id)) {
                return res.status(403).json(ApiResponse.forbidden("Hafta ve ders eşleşmedi"))
            }
        }

        return next();
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bir hata oluştu", error))
    }
}