import ApiResponse from "../utils/apiResponse.js";

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
        if (eventData.visibility === 'class' && req.user.role === "student") res.status(403).json(ApiResponse.forbidden("Bu işlem için yetkiniz yok"))
        eventData.metadata.createdBy = req.user.id
        const event = await eventDatabaseModule.createEvent(eventData);

        if (eventData.visibility === 'class') await invalidateKey(`class:${eventData.classroom}:events`)
        else await invalidateKey(`user:${req.user.id}:events`)

        res.status(201).json(ApiResponse.success("Event oluşturuldu.", event, 201))
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, "Event oluşturulurken bir hata meydana geldi.", error);
    }
}

export const listUserEvents = async (req, res) => {
    try {
        const { year, month } = req.params;
        const monthKey = `${year}-${month}`;
        const userData = await userCacheModule.getCachedUserData(req.user.id, userDatabaseModule.getUserById)

        const userClasses = userData.teachingClasses.concat(userData.enrolledClasses)
        const classKeys = userClasses.map(classId => `class:${classId}:events:${monthKey}`);


        res.status(200).json(ApiResponse.success("Eventler listelendi.", events, 200))
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, "Eventler listelenirken bir hata meydana geldi.", error);
    }
}