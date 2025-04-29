//Cache Modules
import *as userCacheModule from "../cache/modules/userModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";

// Queues
import mailQueue from "../queue/queues/mailQueue.js";
import notificationQueue from "../queue/queues/notificationQueue.js";

export default async (userId, notificationData) => {
    try {
        const user = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById)

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
                userId,
                subject: notificationData.subject,
                message: notificationData.message
            });
        }


        return;
    } catch (error) {
        console.error("Error in notification service:", error);
    }
};