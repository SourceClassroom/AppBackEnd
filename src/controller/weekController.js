import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as weekCacheModule from "../cache/modules/weekModule.js";
import *as classCacheModule from "../cache/modules/classModule.js";

//Database Modules
import *as weekDatabaseModule from "../database/modules/weekModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";

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

        // Get existing weeks for this class
        const existingWeeks = await classCacheModule.getClassWeeks(classId, classDatabaseModule.getWeeksByClassId);
        const weeksData = await multiGet(existingWeeks, 'week', weekDatabaseModule.getMultiWeeks);

        // Check for date overlap with existing weeks
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);

        const hasOverlap = weeksData.some(week => {
            const weekStart = new Date(week.startDate);
            const weekEnd = new Date(week.endDate);
            return (newStartDate <= weekEnd && newEndDate >= weekStart);
        });

        if (hasOverlap) {
            return res.status(400).json(ApiResponse.error("Seçilen tarih aralığı mevcut haftalarla çakışıyor."));
        }

        // Hafta oluştur
        const newWeekData = {
            classroom: classId,
            title,
            description,
            startDate: newStartDate,
            endDate: newEndDate
        };

        // Veritabanına kaydet
        const newWeek = await weekDatabaseModule.createWeek(newWeekData)
        await classDatabaseModule.pushWeekToClass(classId, newWeek._id)
        await invalidateKeys([`class:${classId}:weeks`])

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

        // Get class id from week data
        const classId = getWeekData.classroom;

        // Get all weeks for this class
        const existingWeeks = await classCacheModule.getClassWeeks(classId, classDatabaseModule.getWeeksByClassId);
        const weeksData = await multiGet(existingWeeks, 'week', weekDatabaseModule.getMultiWeeks);

        // Check for date overlap with existing weeks
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);

        const hasOverlap = weeksData.some(week => {
            // Skip checking against the week being updated
            if(week._id.toString() === weekId) return false;

            const weekStart = new Date(week.startDate);
            const weekEnd = new Date(week.endDate);
            return (newStartDate <= weekEnd && newEndDate >= weekStart);
        });

        if (hasOverlap) {
            return res.status(400).json(ApiResponse.error("Seçilen tarih aralığı mevcut haftalarla çakışıyor."));
        }

        const updateWeekData = {
            title,
            description,
            startDate: newStartDate,
            endDate: newEndDate
        };

        const updateWeek = await weekDatabaseModule.updateWeek(weekId, updateWeekData)
        await invalidateKeys([`week:${weekId}`])

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

        const getClassWeeks = await classCacheModule.getClassWeeks(classId, classDatabaseModule.getWeeksByClassId)
        if (!getClassWeeks) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const weeksData = await multiGet(getClassWeeks, 'week', weekDatabaseModule.getMultiWeeks)

        return res.status(200).json(ApiResponse.success("Sınıf haftaları.", weeksData));
    } catch (error) {
        console.error('Class haftaları fetch hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Class haftaları alinirken bir hata meydana geldi.', error)
        );
    }
}

export const deleteWeek = async (req, res) => {
    try {
        const { weekId, classId } = req.params;

        const getWeekData = await weekCacheModule.getCachedWeekData(weekId, weekDatabaseModule.getWeekById)
        if (!getWeekData) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        const deleteWeek = await weekDatabaseModule.deleteWeek(weekId)
        await weekCacheModule.clearWeekCache(weekId)

        return res.status(200).json(ApiResponse.success("Hafta başarıyla silindi.", deleteWeek, 200));
    } catch (error) {
        console.error('Hafta silme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta silinirken bir hata oluştu', error)
        );
    }
}