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
        if (initUserData === "no_code") return res.status(400).json(ApiResponse.badRequest("Zoom ile giriş yapılırken bir hata meydana geldi."))
        if (initUserData === "no_user_id") return res.status(400).json(ApiResponse.badRequest("Zoom ile giriş yapılırken bir hata meydana geldi."))

        return res.status(200).json(ApiResponse.success("Zoom ile giriş yapıldı.", initUserData))
    } catch (error) {
        console.error(error)
        return res.statsu(500).json(ApiResponse.serverError("Zoom ile giriş yapılırken bir hata meydana geldi."))
    }
}

