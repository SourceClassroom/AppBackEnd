import ApiResponse from "../utils/apiResponse.js";
import {notifyClassMembers} from "../services/notificationService.js";

const sendNotificationtoClass = async (req, res) => {
    try {
        const {classId, message, type, title} = req.body;
        const notifications = await notifyClassMembers(classId, type, title, message);
        res.status(200).send(notifications);
    } catch (error) {
        console.error('Bildirim oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Bildirim oluşturulurken bir hata oluştu', error)
        );
    }
}

export {
    sendNotificationtoClass
}