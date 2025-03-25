import ApiResponse from "../utils/apiResponse.js";
import {Week} from "../database/models/weekModel.js";
import {Class} from "../database/models/classModel.js";


/**
 * Hafta oluşturma
 * @route POST /api/week/create
 * @access Private [Class Teacher/sysadmin]
 */
const createWeek = async (req, res) => {
    try {
        const { classId, title, description, startDate, endDate } = req.body;
        console.log(classId, title, description, startDate, endDate);
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
        const newWeek = new Week({
            classroom: classId,
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        // Veritabanına kaydet
        await newWeek.save();

        // Başarılı yanıt
        return res.status(201).json(ApiResponse.success("Hafta başarıyla oluşturuldu.", newWeek, 201));

    } catch (error) {
        console.error('Hafta oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Hafta oluşturulurken bir hata oluştu', error)
        );
    }
};

export {
    createWeek,
}