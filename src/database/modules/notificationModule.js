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