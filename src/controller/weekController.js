import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import {invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as weekCacheModule from "../cache/modules/weekModule.js";
import *as classCacheModule from "../cache/modules/classModule.js";

//Database Modules
import *as weekDatabaseModule from "../database/modules/weekModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";

/*TODO
* Sınıftaki diğer haftaların günleri kontrol edilecek ve haftalar üst üste binmeyecek
*/

/**
 * Hafta oluşturma
 * @route POST /api/week/create
 * @access Private [Class Teacher/sysadmin]
 */
export const createWeek = async (req, res) => {
    try {
        const { classId, title, description, startDate, endDate } = req.body;
        // Sınıfı getir
        const getClassData = await classCacheModule.getCachedClassData(classId, classDatabaseModule.getClassById)

        // Sınıf mevcut mu kontrol et
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        // Hafta oluştur
        const newWeekData = {
            classroom: classId,
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };

        // Veritabanına kaydet
        const newWeek = await weekDatabaseModule.createWeek(newWeekData)
        await classDatabaseModule.pushWeekToClass(classId, newWeek._id)
        await invalidateKeys([`class:${classId}:weeks`, `class:${classId}`])

        // Başarılı yanıt
        return res.status(201).json(ApiResponse.success("Hafta başarıyla oluşturuldu.", newWeek, 201));

    } catch (error) {
        console.error('Hafta oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta oluşturulurken bir hata oluştu', error)
        );
    }
};

export const updateWeek = async (req, res) => {
    try {
        const { weekId } = req.params;
        const { title, description, startDate, endDate } = req.body;

        const getWeekData = await weekCacheModule.getCachedWeekData(weekId, weekDatabaseModule.getWeekById)
        if (!getWeekData) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        const updateWeekData = {
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };

        const updateWeek = await weekDatabaseModule.updateWeek(weekId, updateWeekData)
        await invalidateKeys([`week:${weekId}`, `class:${getWeekData.classroom}:weeks`, `class:${getWeekData.classroom}`])

        return res.status(200).json(ApiResponse.success("Hafta başarıyla güncellendi.", updateWeek, 200));
    } catch (error) {
        console.error('Hafta güncelleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta güncellenirken bir hata oluştu', error)
        );
    }
}


export const getClassWeeks = async (req, res) => {
    try {
        const { classId } = req.params;

        const getWeeksData = await classCacheModule.getClassWeeks(classId, classDatabaseModule.getWeeksByClassId)
        if (!getWeeksData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        return res.status(200).json(ApiResponse.success("Sınıf haftaları.", getWeeksData));
    } catch (error) {
        console.error('Class haftaları fetch hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Class haftaları alinirken bir hata meydana geldi.', error)
        );
    }
}