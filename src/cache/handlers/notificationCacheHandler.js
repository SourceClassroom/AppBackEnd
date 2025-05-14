import getOrSet from "../strategies/getOrSet.js";

const NOTIFICATION_KEY = (notificationId) => `notification:${notificationId}`;

export const getCachedNotificationData = async (notificationId, fetchFn) => {
    try {
        return await getOrSet(NOTIFICATION_KEY(notificationId), () => fetchFn(notificationId));
    } catch (error) {
        console.error(error)
        throw error
    }
}