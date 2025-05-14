//Cache Handlers
import *as userCacheHandler from "../cache/handlers/userCacheHandler.js";

//Database Repositories
import *as userDatabaseRepository from "../database/repositories/userRepository.js";

// Queues
import mailQueue from "../queue/queues/mailQueue.js";
import notificationQueue from "../queue/queues/notificationQueue.js";

export default async (userId, notificationData) => {
    try {
        const user = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)

        if (!user) {
            console.error(`User not found for ID: ${userId}`);
            return;
        }
        const prefs = user.notificationPreferences || {};

        if (!prefs[notificationData.type]) return;

        await notificationQueue.add("saveNotification", {
            userId,
            notificationData,
            allowPush: prefs.push_notifications
        });


        if (prefs.email_notifications) {
            await mailQueue.add("sendMail", {
                email: user.email,
                name: `${user.name} ${user.surname}`,
                notificationData
            });
        }


        return;
    } catch (error) {
        console.error("Error in notification service:", error);
    }
};