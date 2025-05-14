import validator from "validator";
import ApiResponse from "../utils/apiResponse.js";
import {generateMonthKey} from "../utils/dateRange.js";
import {generateCode} from "../services/randomCodeService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Handlers
import * as weekCacheHandler from "../cache/handlers/weekCacheHandler.js";
import * as classCacheHandler from "../cache/handlers/classCacheHandler.js";
import * as lessonCacheHandler from "../cache/handlers/lessonCacheHandler.js";

//Database Repositories
import * as weekDatabaseRepository from "../database/repositories/weekRepository.js";
import * as classDatabaseRepository from "../database/repositories/classRepository.js";
import * as eventDatabaseRepository from "../database/repositories/eventRepository.js";
import * as lessonDatabaseRepository from "../database/repositories/lessonRepository.js";

//Notifications
import notifyClassroom from "../notifications/notifyClassroom.js";

export const createLesson = async (req, res) => {
    try {
        let {topic, start_time, classId, week, description, joinUrl} = req.body

        const lessonData = {
            classroom: classId,
            week,
            title: topic,
            description,
            startDate: start_time,
            joinUrl: joinUrl ? joinUrl : `${process.env.JITSI_URL}/${generateCode(32)}`,
        }
        const newLessonData = await lessonDatabaseRepository.createLesson(lessonData)
        if (week) {
            await weekDatabaseRepository.pushLessonToWeek(week, newLessonData._id)
            await invalidateKey(`week:${week}:lessons`)
        }
        else {
            await classDatabaseRepository.pushLessonToClass(classId, newLessonData._id)
            await invalidateKey(`class:${classId}:lessons`)
        }

        const classData = await classCacheHandler.getCachedClassData(lessonData.classroom, classDatabaseRepository.getClassById);

        const eventData = {
            classId,
            title: `${topic} Canlı Ders.`,
            description: description.slice(0, 20) || "Açıklama belirtilmemiş",
            date: start_time,
            type: "lesson",
            visibility: "class",
            metadata: {
                createdBy: req.user.id,
                tags: ["ders"],
                color: "#007f5c"
            }
        }
        const monthKey = generateMonthKey(start_time)
        await invalidateKey(`events:${classId}:${monthKey}`)
        await eventDatabaseRepository.createEvent(eventData)

        const notificationData = {
            type: "new_lesson",
            classId,
            subject: `${classData.title} sıfınında yeni bir ders oluşturuldu.`,
            classTitle: classData.title,
            message: `${description.slice(0, 30)}...` || "Açıklama belirtilmemiş",
            path: `${process.env.FRONTEND_URL}/class/${classId}/lessons`,
            actionText: "Derse Git",
        }

        notifyClassroom(classId, notificationData)

        return res.status(200).json(ApiResponse.success("Ders başarıyla oluşturuldu.", lessonData))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Ders oluşturulurken bir hata meydana geldi."))
    }
}

export const getClassLessons = async (req, res) => {
    try {
        const { classId } = req.params;

        const classLessons = await classCacheHandler.getClassLessons(classId, classDatabaseRepository.getClassLessons);
        let getLessonData = await multiGet(classLessons, "lesson", lessonDatabaseRepository.getMultiLessonById);

        if (req.user.role === "student") {
            getLessonData = getLessonData.map(lesson => {
                if (lesson.status === "pending" || lesson.status === "ended") {
                    const { joinUrl, ...rest } = lesson;
                    return rest;
                }
                return lesson;
            });
        }

        return res.status(200).json(ApiResponse.success("Dersler başarıyla getirildi.", getLessonData));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Dersler getirilirken bir hata meydana geldi."));
    }
};

export const getWeekLessons = async (req, res) => {
    try {

        const { weekId } = req.params;
        const weekLessons = await weekCacheHandler.getCachedWeekLessons(weekId, weekDatabaseRepository.getWeekLessons)
        let getLessonData = await multiGet(weekLessons, "lesson", lessonDatabaseRepository.getMultiLessonById)

        if (req.user.role === "student") {
            getLessonData = getLessonData.map(lesson => {
                if (lesson.status === "pending" || lesson.status === "ended") {
                    const { joinUrl, ...rest } = lesson;
                    return rest;
                }
                return lesson;
            });
        }

        return res.status(200).json(ApiResponse.success("Dersler başarıyla getirildi.", getLessonData));
    } catch (error) {
        console.error(error)
        res.status(500).json(ApiResponse.serverError("Dersler getirilirken bir hata meydana geldi."))
    }
}

export const updateLessonStatus = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { status, classId } = req.body;

        const lessonData = await lessonCacheHandler.getCachedLessonData(lessonId, lessonDatabaseRepository.getLessonById);

        if (!lessonData) return res.status(404).json(ApiResponse.notFound("Ders bulunamadı."));
        if (!validator.isIn(status, ['pending', 'started', 'ended'])) return res.status(400).json(ApiResponse.error("Geçersiz ders durumu."));
        if (lessonData.status === status) return res.status(400).json(ApiResponse.error("Ders zaten bu durumda."))
        if (lessonData.status === "ended") return res.status(400).json(ApiResponse.error("Bitmiş ders tekrar başlayamaz."))
        const classData = await classCacheHandler.getCachedClassData(lessonData.classroom, classDatabaseRepository.getClassById);

        await lessonDatabaseRepository.updateLessonStatus(lessonId, status)
        await invalidateKey(`lesson:${lessonId}`);

        const notificationData = {
            type: "lesson_reminder",
            subject: `${lessonData.title} dersi başladı koş!`,
            classTitle: classData.title,
            message: lessonData.description || "Açıklama belirtilmemiş",
            path: `${process.env.FRONTEND_URL}/class/${classId}`,
            actionText: "Derse Git",
        }

        if (status === "started") notifyClassroom(lessonData.classroom, notificationData);

        return res.status(200).json(ApiResponse.success("Ders durumu başarıyla güncellendi.", lessonData));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Ders durumu güncellenirken bir hata meydana geldi."));
    }
}

export const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { topic, start_time, description, joinUrl } = req.body;

        const lessonData = await lessonCacheHandler.getCachedLessonData(lessonId, lessonDatabaseRepository.getLessonById);

        if (!lessonData) return res.status(404).json(ApiResponse.notFound("Ders bulunamadı."));

        const updateData = {
            title: topic,
            startDate: start_time,
            description,
            joinUrl: joinUrl ? joinUrl : `${process.env.JITSI_URL}/${topic}_${generateCode(32)}`,
        }

        await lessonDatabaseRepository.updateLesson(lessonId, updateData)
        await invalidateKey(`lesson:${lessonId}`);

        return res.status(200).json(ApiResponse.success("Ders başarıyla güncellendi.", lessonData));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Ders güncellenirken bir hata meydana geldi."));
    }
}

export const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lessonData = await lessonCacheHandler.getCachedLessonData(lessonId, lessonDatabaseRepository.getLessonById);

        if (!lessonData) return res.status(404).json(ApiResponse.notFound("Ders bulunamadı."));

        await lessonDatabaseRepository.deleteLesson(lessonId, req.user.id)
        await invalidateKey(`lesson:${lessonId}`);

        //TODO pull something if it deleted for every fucking thig
        //await classDatabaseRepository.pullLessonFromClass(classId, lessonId)
        await invalidateKey(`class:${classId}:lessons`)

        return res.status(200).json(ApiResponse.success("Ders başarıyla silindi.", lessonData));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Ders silinirken bir hata meydana geldi."));
    }
}