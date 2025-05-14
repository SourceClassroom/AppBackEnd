import ApiResponse from "../utils/apiResponse.js";

//Cache Handlers
import *as notificationCacheHandler from "../cache/handlers/notificationCacheHandler.js";

//Database Repositories
import *as notificationDatabaseRepository from "../database/repositories/notificationRepository.js";

export const checkNotificationOwner = async (req, res, next) => {
    try {
        const { user } = req;
        const {notificationId} = req.params;

        if (!notificationId) {
            return res.status(400).json(ApiResponse.error("Lütfen geçerli bir bildirim ID'si belirtin"));
        }

        const notification = await notificationCacheHandler.getCachedNotificationData(notificationId, notificationDatabaseRepository.getNotificationById)
        if (!notification) {
            return res.status(404).json(ApiResponse.error("Belirtilen ID ile eşleşen bildirim bulunamadı"));
        }

        if (notification.user.toString() !== user.id) {
            return res.status(403).json(ApiResponse.forbidden("Bu işlem için gerekli izniniz bulunmamaktadır"));
        }

        next();
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirim kontrolü sırasında bir hata oluştu", error));
    }
};