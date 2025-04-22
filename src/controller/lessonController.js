import ApiResponse from "../utils/apiResponse.js";
import * as zoomService from "../services/zoomService.js";

//Database Modules
import * as lessonDatabaseModule from "../database/modules/lessonModule.js";

export const createLesson = async (req, res) => {
    try {
        const userId = req.user.id
        const {topic, type, start_time, duration = 60, classId, week, description} = req.body
        const zoomUserData = await zoomService.getZoomUserData(userId)
        if (!zoomUserData?.id) return res.status(400).json(ApiResponse.error("Toplantı oluşturulurken bir hata meydana geldi."))
        const meetingData = await zoomService.createMeeting(userId, zoomUserData?.id, topic, type, start_time, duration)
        const lessonData = {
            clasroom: classId,
            week,
            title: topic,
            description,
            startDate: start_time,
            meetingId: meetingData._id
        }
        await lessonDatabaseModule.createLesson(lessonData)

        return res.status(200).json(ApiResponse.success("Ders başarıyla oluşturuldu.", lessonData))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Ders oluşturulurken bir hata meydana geldi."))
    }
}