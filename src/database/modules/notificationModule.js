import { Notification } from "../models/notificationModel.js";

const expireAfterDays = 14;

export const createNotification = async (userId, data) => {
    try {
        const notificationData = {

            user: userId,
            classroom: data?.classId,
            conversation: data?.conversationId,
            type: data.type,
            message: data.message,
            subject: data.subject,
            expireAt: new Date(Date.now() + expireAfterDays * 24 * 60 * 60 * 1000) //14 Gün
        }

        return await Notification.create(notificationData);
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getNotifications = async (userId) => {
    try {
        return await Notification.find({ user: userId }).sort({ createdAt: -1 }).select("_id");
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getNotificationById = async (notificationId) => {
    try {
        return await Notification.findById(notificationId);
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getMultiNotificationsById = async (notificationIds) => {
    try {
        return await Notification.find({ _id: { $in: notificationIds } });
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const markAllAsRead = async (userId) => {
    try {
        return await Notification.updateMany({ user: userId }, { isRead: true });
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const removeNotification = async (notificationId) => {
    try {
        return await Notification.findByIdAndDelete(notificationId);
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const markAsRead = async (notificationId) => {
    try {
        return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    } catch (error) {
        console.error(error)
        throw error
    }
}