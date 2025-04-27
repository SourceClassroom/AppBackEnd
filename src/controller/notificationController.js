import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKey, invalidateKeys } from "../cache/strategies/invalidate.js";

//Cahce Modules
import *as userCacheModule from "../cache/modules/userModule.js";
import *as notificationCacheModule from "../cache/modules/notificationModule.js";

//Database Modules
import *as notificationDatabaseModule from "../database/modules/notificationModule.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id
        const userNotifications = await userCacheModule.getCachedUserNotifications(userId, notificationDatabaseModule.getNotifications)

        const notifications = await multiGet(userNotifications, "notification", notificationDatabaseModule.getMultiNotificationsById)

        res.status(200).json(ApiResponse.success("Bildirimler başarıyla getirildi.", notifications))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirimler getirilirken bir hata meydana geldi.", error))
    }
}

export const markAsRead = async (req, res) => {
    try {
        const {notificationId} = req.params
        const updateNotification = await notificationDatabaseModule.markAsRead(notificationId)
        if (!updateNotification) return res.status(404).json(ApiResponse.notFound("Bildirim bulunamadı.", null))
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
        const userNotifications = await userCacheModule.getCachedUserNotifications(userId, notificationDatabaseModule.getNotifications)
        await notificationDatabaseModule.markAllAsRead(userNotifications)
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
        const deletedNotification = await notificationDatabaseModule.removeNotification(notificationId)
        if (!deletedNotification) return res.status(404).json(ApiResponse.notFound("Bildirim bulunamadı.", null))
        await invalidateKeys([`notification:${notificationId}`, `user:${req.user.id}:notifications`])
        res.status(200).json(ApiResponse.success("Bildirim başarıyla silindi.", deletedNotification))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Bildirim silinirken bir hata meydana geldi.", error))
    }
}