import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as weekCacheHandler from "../cache/handlers/weekCacheHandler.js";
import *as classCacheHandler from "../cache/handlers/classCacheHandler.js";

//Database Repositories
import *as weekDatabaseRepository from "../database/repositories/weekRepository.js";
import *as classDatabaseRepository from "../database/repositories/classRepository.js";

/**
 * Hafta oluşturma
 * @route POST /api/week/create
 * @access Private [Class Teacher/sysadmin]
 */
export const createWeek = async (req, res) => {
    try {
        const { classId, title, description, startDate, endDate } = req.body;
        // Sınıfı getir
        const getClassData = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)

        // Sınıf mevcut mu kontrol et
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        // Get existing weeks for this class
        const existingWeeks = await classCacheHandler.getClassWeeks(classId, classDatabaseRepository.getWeeksByClassId);
        const weeksData = await multiGet(existingWeeks, 'week', weekDatabaseRepository.getMultiWeeks);

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
        const newWeek = await weekDatabaseRepository.createWeek(newWeekData)
        await classDatabaseRepository.pushWeekToClass(classId, newWeek._id)
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

        const getWeekData = await weekCacheHandler.getCachedWeekData(weekId, weekDatabaseRepository.getWeekById)
        if (!getWeekData) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        // Get class id from week data
        const classId = getWeekData.classroom;

        // Get all weeks for this class
        const existingWeeks = await classCacheHandler.getClassWeeks(classId, classDatabaseRepository.getWeeksByClassId);
        const weeksData = await multiGet(existingWeeks, 'week', weekDatabaseRepository.getMultiWeeks);

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

        const updateWeek = await weekDatabaseRepository.updateWeek(weekId, updateWeekData)
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

        const getClassWeeks = await classCacheHandler.getClassWeeks(classId, classDatabaseRepository.getWeeksByClassId)
        if (!getClassWeeks) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const weeksData = await multiGet(getClassWeeks, 'week', weekDatabaseRepository.getMultiWeeks)

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

        const getWeekData = await weekCacheHandler.getCachedWeekData(weekId, weekDatabaseRepository.getWeekById)
        if (!getWeekData) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        const deleteWeek = await weekDatabaseRepository.deleteWeek(weekId, req.user.id)
        await weekCacheHandler.clearWeekCache(weekId)

        return res.status(200).json(ApiResponse.success("Hafta başarıyla silindi.", deleteWeek, 200));
    } catch (error) {
        console.error('Hafta silme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta silinirken bir hata oluştu', error)
        );
    }
}