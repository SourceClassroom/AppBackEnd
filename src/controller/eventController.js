import ApiResponse from "../utils/apiResponse.js";
import { generateMonthKey } from "../utils/dateRange.js";

//Cache Strategies
import { invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Modules
import *as userCacheModule from "../cache/modules/userModule.js";
import *as classCacheModule from "../cache/modules/classModule.js";
import *as eventCacheModule from "../cache/modules/eventModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";
import *as eventDatabaseModule from "../database/modules/eventModule.js";

export const createEvent = async (req, res) => {
    try {
        let eventData =  req.body;
        const classData = await classCacheModule.getCachedClassData(eventData.classroom, classDatabaseModule.getClassById)
        if (eventData.visibility === 'class') {
            if (req.user.role === "student") return res.status(403).json(ApiResponse.forbidden("Bu işlem için yetkiniz yok"))
            if (!req.body?.classId) return res.status(400).json(ApiResponse.error("Lütfen bir sınıf seçiniz."))
            if (classData.teacher !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Bu işlem için yetkiniz yok"))
        }
        eventData.metadata.createdBy = req.user.id

        const event = await eventDatabaseModule.createEvent(eventData);
        console.log(`user:${eventData.visibility === "class" ? eventData.classroom : req.user.id}:events:${generateMonthKey(eventData.startDate)}`)
        await invalidateKey(`user:${eventData.visibility === "class" ? eventData.classroom : req.user.id}:events:${generateMonthKey(eventData.startDate)}`)

        res.status(201).json(ApiResponse.success("Event oluşturuldu.", event, 201))
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, "Event oluşturulurken bir hata meydana geldi.", error);
    }
}

export const listUserEvents = async (req, res) => {
    try {
        const userId = req.user.id
        const { year, month } = req.query;
        if (!year || !month) return res.status(400).json(ApiResponse.error("Lütfen yıl ve ay bilgilerini sağlayın."))
        const monthKey = `${year}-${month}`;

        const userData = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById)

        const userClasses = userData.teachingClasses.concat(userData.enrolledClasses)

       const eventData = await eventCacheModule.getMultiCachedEvents(req.user.id, userClasses, eventDatabaseModule.getEvents, monthKey)

        res.status(200).json(ApiResponse.success("Eventler listelendi.", eventData, 200))
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, "Eventler listelenirken bir hata meydana geldi.", error);
    }
}