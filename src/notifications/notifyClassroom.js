import sendMail from "../mailer/sendMail.js";
import { getSocketServer } from "../socket/socketInstance.js";
import { returnUserPrefs } from  "../services/notificationService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";

//Cache Modules
import *as classCacheModule from "../cache/modules/classModule.js";
import *as onlineUserCacheModule from "../cache/modules/onlineUserModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";


export default async (classId, notificationData) => {
    try {
        const io = getSocketServer()

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

            const {allowThisNotification, allowPush, allowEmail} = returnUserPrefs(prefs, notificationData.type);

            if (!allowThisNotification) continue;

            const sockets = allowPush ? await onlineUserCacheModule.getUserSockets(student._id) : [];

            if (sockets && sockets.length > 0) {
                sockets.forEach((socketId) => {
                    io.to(socketId).emit("notification", notificationData);
                });
            } else if (allowEmail) {
                sendMail(student.email, notificationData.subject, notificationData.message)
            }
        }

    } catch (error) {
        console.error("Error in notification service:", error);
    }
};