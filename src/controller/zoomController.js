import ApiResponse from "../utils/apiResponse.js";

//Cache Modules
import *as zoomCacheModule from "../cache/modules/zoomModule.js";

//Database Modules
import *as zoomDatabaseModule from "../database/modules/zoomModule.js";

//Services
import * as zoomService from "../services/zoomService.js";

export const authUser = async (req, res) => {
    try {
        const initUserData = await zoomService.getAccessToken(req)
        if (initUserData === "no_code") return res.status(400).json(ApiResponse.error("Zoom ile giriş yapılırken bir hata meydana geldi."))
        if (initUserData === "no_user_id") return res.status(400).json(ApiResponse.error("Zoom ile giriş yapılırken bir hata meydana geldi."))

        return res.status(200).json(ApiResponse.success("Zoom ile giriş yapıldı.", initUserData))
    } catch (error) {
        console.error(error)
        return res.statsu(500).json(ApiResponse.serverError("Zoom ile giriş yapılırken bir hata meydana geldi."))
    }
}
//TODO
//Move This function to lessonController and yes create lesson controller and before you go one more thing we still need events...
export const createMeeting = async (req, res) => {
    try {
        const {userId, topic, type, start_time, duration} = req.body
        const zoomUserData = await zoomService.getZoomUserData(userId)
        if (!zoomUserData?.id) return res.status(400).json(ApiResponse.error("Toplantı oluşturulurken bir hata meydana geldi."))
        const meetingData = await zoomService.createMeeting(userId, zoomUserData?.id, topic, type, start_time, duration)

        return res.status(200).json(ApiResponse.success("Toplantı başarıyla oluşturuldu.", meetingData))
    } catch (error) {
        console.error(error)
        return res.status(500).json(ApiResponse.serverError("Toplantı oluşturulurken bir hata meydana geldi."))
    }
}