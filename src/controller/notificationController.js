import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKey, invalidateKeys } from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as userCacheHandler from "../cache/handlers/userCacheHandler.js";

//Database Repositories
import *as notificationDatabaseRepository from "../database/repositories/notificationRepository.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id
        const userNotifications = await userCacheHandler.getCachedUserNotifications(userId, notificationDatabaseRepository.getNotifications)

        const notifications = await multiGet(userNotifications, "notification", notificationDatabaseRepository.getMultiNotificationsById)

        res.status(200).json(ApiResponse.success("Bildirimler başarıyla getirildi.", notifications))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirimler getirilirken bir hata meydana geldi.", error))
    }
}

export const markAsRead = async (req, res) => {
    try {
        const {notificationId} = req.params
        const updateNotification = await notificationDatabaseRepository.markAsRead(notificationId)
        if (!updateNotification) return res.status(404).json(ApiResponse.notFound("Bildirim bulunamadı."))
        await invalidateKey(`notification:${notificationId}`)
        res.status(200).json(ApiResponse.success("Bildirim başarıyla okundu.", updateNotification))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirim görüntülenirken bir hata meydana geldi.", error))
    }
}

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id
        const userNotifications = await userCacheHandler.getCachedUserNotifications(userId, notificationDatabaseRepository.getNotifications)
        await notificationDatabaseRepository.markAllAsRead(userNotifications)
        await invalidateKey(`user:${userId}:notifications`)
        for (const userNotification of userNotifications) {
            invalidateKey(`notification:${userNotification._id}`)
        }
        return res.status(200).json(ApiResponse.success("Tüm bildirimler başarıyla okundu.", null))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirimler okunurken bir hata meydana geldi.", error))
    }
}

export const removeNotification = async (req, res) => {
    try {
        const {notificationId} = req.params
        const deletedNotification = await notificationDatabaseRepository.removeNotification(notificationId)
        if (!deletedNotification) return res.status(404).json(ApiResponse.notFound("Bildirim bulunamadı."))
        await invalidateKeys([`notification:${notificationId}`, `user:${req.user.id}:notifications`])
        res.status(200).json(ApiResponse.success("Bildirim başarıyla silindi.", deletedNotification))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirim silinirken bir hata meydana geldi.", error))
    }
}