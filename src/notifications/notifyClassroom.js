//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";

//Cache Handlers
import *as classCacheHandler from "../cache/handlers/classCacheHandler.js";

//Database Repositories
import *as userDatabaseRepository from "../database/repositories/userRepository.js";
import *as classDatabaseRepository from "../database/repositories/classRepository.js";

// Queues
import mailQueue from "../queue/queues/mailQueue.js";
import notificationQueue from "../queue/queues/notificationQueue.js";


export default async (classId, notificationData) => {
    try {
        console.log(classId)
        const classStudentList = await classCacheHandler.getCachedStudentList(classId, classDatabaseRepository.getStudentsByClassId)
        if (!classStudentList || classStudentList.length === 0) {
            return;
        }

        const studentData = await multiGet(classStudentList,"user", userDatabaseRepository.getUserById)
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
