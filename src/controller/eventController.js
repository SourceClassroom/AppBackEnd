import ApiResponse from "../utils/apiResponse.js";
import { generateMonthKey } from "../utils/dateRange.js";

//Cache Strategies
import { invalidateKey } from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as userCacheHandler from "../cache/handlers/userCacheHandler.js";
import *as classCacheHandler from "../cache/handlers/classCacheHandler.js";
import *as eventCacheHandler from "../cache/handlers/eventCacheHandler.js";

//Database Repositories
import *as userDatabaseRepository from "../database/repositories/userRepository.js";
import *as classDatabaseRepository from "../database/repositories/classRepository.js";
import *as eventDatabaseRepository from "../database/repositories/eventRepository.js";

export const createEvent = async (req, res) => {
    try {
        let eventData =  req.body;
        const classData = await classCacheHandler.getCachedClassData(eventData.classroom, classDatabaseRepository.getClassById)
        if (eventData.visibility === 'class') {
            if (req.user.role === "student") return res.status(403).json(ApiResponse.forbidden("Bu işlem için yetkiniz yok"))
            if (!req.body?.classId) return res.status(400).json(ApiResponse.error("Lütfen bir sınıf seçiniz."))
            if (classData.teacher !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Bu işlem için yetkiniz yok"))
        }
        if (eventData.visibility === "user") eventData.userId = req.user.id
        eventData.metadata.createdBy = req.user.id

        const event = await eventDatabaseRepository.createEvent(eventData);

        console.log(`events:${eventData.visibility === "class" ? eventData.classroom : req.user.id}:${generateMonthKey(eventData.date)}`)
        await invalidateKey(`events:${eventData.visibility === "class" ? eventData.classroom : req.user.id}:${generateMonthKey(eventData.date)}`)

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

        const userData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)

        const userClasses = userData.teachingClasses.concat(userData.enrolledClasses)
        userClasses.push(userId)

        const eventData = await eventCacheHandler.getMultiCachedEvents(userClasses, eventDatabaseRepository.getEvents, monthKey)

        res.status(200).json(ApiResponse.success("Eventler listelendi.", eventData, 200))
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, "Eventler listelenirken bir hata meydana geldi.", error);
    }
}