import ApiResponse from "../utils/apiResponse.js";
import {generateCode} from "../services/randomCodeService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Modules
import * as weekCacheModule from "../cache/modules/weekModule.js";
import * as classCacheModule from "../cache/modules/classModule.js";
import * as lessonCacheModule from "../cache/modules/lessonModule.js";

//Database Modules
import * as weekDatabaseModule from "../database/modules/weekModule.js";
import * as classDatabaseModule from "../database/modules/classModule.js";
import * as lessonDatabaseModule from "../database/modules/lessonModule.js";

//Notifications
import notifyClassroom from "../notifications/notifyClassroom.js";

export const createLesson = async (req, res) => {
    try {
        let {topic, start_time, classId, week, description, joinUrl} = req.body

        const lessonData = {
            clasroom: classId,
            week,
            title: topic,
            description,
            startDate: start_time,
            joinUrl: joinUrl ? joinUrl : `https://meet.jit.si/${topic}_${generateCode(32)}`,
        }
        await lessonDatabaseModule.createLesson(lessonData)
        if (week) await invalidateKey(`week:${week}:lessons`)
        else await invalidateKey(`class:${classId}:lessons`)

        const notificationData = {
            type: "new_post",
            subject: "Yeni bir ders oluşturuldu.",
            message: `${classroom.title} sınıfında yeni bir ders oluşturuldu.`
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

        const classLessons = await classCacheModule.getClassLessons(classId, classDatabaseModule.getClassLessons);
        let getLessonData = await multiGet(classLessons, "lesson", lessonDatabaseModule.getMultiLessonById);

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
        const { week } = req.params;
        const weekLessons = await weekCacheModule.getCachedWeekLessons(week, weekDatabaseModule.getWeekLessons)
        let getLessonData = await multiGet(weekLessons, "lesson", lessonDatabaseModule.getMultiLessonById)

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
        const { status } = req.body;

        const lessonData = await lessonCacheModule.getCachedLesson(lessonId, lessonDatabaseModule.getLessonById);

        if (!lessonData) return res.status(404).json(ApiResponse.notFound("Ders bulunamadı."));
        if (lessonData.status === status) return res.status(400).json("Ders durumu eskisi ile aynı olamaz.")

        await lessonDatabaseModule.updateLessonStatus(lessonId, status)
        await invalidateKey(`lesson:${lessonId}`);

        const notificationData = {
            type: "lesson_reminder",
            subject: "Ders Başladı",
            message: `${lessonData.title} dersi başladı koş!`
        }

        if (status === "started") notifyClassroom(lessonData.classroom, notificationData);

        return res.status(200).json(ApiResponse.success("Ders durumu başarıyla güncellendi.", lessonData));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Ders durumu güncellenirken bir hata meydana geldi."));
    }
}
