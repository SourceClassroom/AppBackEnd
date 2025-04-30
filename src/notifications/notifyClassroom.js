//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";

//Cache Modules
import *as classCacheModule from "../cache/modules/classModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";

// Queues
import mailQueue from "../queue/queues/mailQueue.js";
import notificationQueue from "../queue/queues/notificationQueue.js";


export default async (classId, notificationData) => {
    try {

        const classStudentList = await classCacheModule.getCachedStudentList(classId, classDatabaseModule.getStudentsByClassId)
        if (!classStudentList || classStudentList.length === 0) {
            return;
        }

        const studentData = await multiGet(classStudentList,"user", userDatabaseModule.getUserById)
        if (!studentData || studentData.length === 0) {
            return;
        }

        for (const student of studentData) {
            const prefs = student.notificationPreferences || {};

            if (!prefs[notificationData.type]) continue;

            await notificationQueue.add("saveNotification", {
                userId: student._id,
                notificationData,
                allowPush: prefs.push_notifications
            });

            if (prefs.email_notifications) {
                await mailQueue.add("sendMail", {
                    email: student.email,
                    name: `${student.name} ${student.surname}`,
                    notificationData
                });
            }

        }

    } catch (error) {
        console.error("Error in notification service:", error);
    }
};