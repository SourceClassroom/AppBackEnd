import ApiResponse from "../utils/apiResponse.js";
import {Week} from "../database/models/weekModel.js";
import {Class} from "../database/models/classModel.js";
import *as cacheService from "../services/cacheService.js";

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
        const classCacheKey = `class:${classId}:weeks`;

        // Sınıfı getir
        const getClassData = await Class.findById(classId);

        // Sınıf mevcut mu kontrol et
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        // Tarihleri karşılaştır
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json(ApiResponse.error("Başlangıç tarihi, bitiş tarihinden önce olmalıdır."));
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
        const newWeek = await Week.create(newWeekData);
        const updateClass = await Class.findByIdAndUpdate(classId, {$push: {weeks: newWeek._id}})
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

        const getWeekData = await Week.findById(weekId);
        if (!getWeekData) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        const updateWeekData = {
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };

        const updateWeek = await Week.findByIdAndUpdate(weekId, updateWeekData, { new: true });
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
        const cacheKey = `class:${classId}:weeks`;

        const getWeeksFromCache = await cacheService.getFromCache(cacheKey);
        if (getWeeksFromCache) {
            return res.status(200).json(ApiResponse.success("Sınıf haftaları.", getWeeksFromCache));
        }

        const getWeeks = await Class.findById(classId)
            .populate({
                path: "weeks",
                select: "title description startDate endDate"
            })

        await cacheService.writeToCache(cacheKey, getWeeks.weeks, 3600);
        return res.status(200).json(ApiResponse.success("Sınıf haftaları.", getWeeks.weeks));
    } catch (error) {
        console.error('Class haftaları fetch hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Class haftaları alinirken bir hata meydana geldi.', error)
        );
    }
}