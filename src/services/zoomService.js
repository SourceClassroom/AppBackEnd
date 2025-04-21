//Encrypt Module
import {encrypt, decrypt} from "../utils/encrypt.js";

//Cache Modules
import * as zoomCacheModule from "../cache/modules/zoomModule.js";

//Database Modules
import * as zoomDatabaseModule from "../database/modules/zoomModule.js";

export const getAccessToken = async (req) => {
    try {
        const code = req.query.code
        if (!code) return "no_code"
        const userId = req.user._id
        if (!userId) return "no_user_id"

        const credentials = Buffer.from(`${process.env.ZOOM_ID}:${process.env.ZOOM_SECRET}`).toString('base64');

        const response = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.FRONT_URL
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Access token alınamadı: ${errorText}`);
        }
        const responseData = await response.json();

        const encryptedAccessToken = encrypt(responseData.access_token)
        const encryptedRefreshToken = encrypt(responseData.refresh_token)
        const returnData = {
            access_token: encryptedAccessToken,
            expires_in: responseData.expires_in
        }
        await zoomDatabaseModule.updateRefreshToken(userId, encryptedRefreshToken)
        await zoomCacheModule.cacheUserAccessToken(userId, returnData)

        return returnData
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const refreshUserToken = async (userId) => {
    try {
        const userZoomData = await zoomDatabaseModule.getUserRefreshToken(userId)
        const refreshToken = decrypt(userZoomData.refreshToken)
        const credentials = Buffer.from(`${process.env.ZOOM_ID}:${process.env.ZOOM_SECRET}`).toString('base64');

        const response = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Access token alınamadı: ${errorText}`);
        }
        const responseData = await response.json();

        const encryptedAccessToken = encrypt(responseData.access_token)
        const encryptedRefreshToken = encrypt(responseData.refresh_token)
        const returnData = {
            access_token: encryptedAccessToken,
            expires_in: responseData.expires_in
        }
        await zoomDatabaseModule.updateRefreshToken(userId, encryptedRefreshToken)
        await zoomCacheModule.cacheUserAccessToken(userId, returnData)

        return responseData.access_token
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getZoomUserData = async (userId) => {
    try {
        let accessToken = await zoomCacheModule.getUserAccessToken(userId)
        if (accessToken) accessToken = decrypt(accessToken)
        if (!accessToken) accessToken = await refreshUserToken(userId)

        const response = await fetch('https://api.zoom.us/v2/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Zoom api hatasi: ${errorText}`);
        }

        return await response.json()
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const createMeeting = async (userId, zoomUserId,topic, type, start_time, duration = 60) => {
    try {
        const accessToken = await zoomCacheModule.getUserAccessToken(userId)
        const decryptedAccessToken = decrypt(accessToken)
        const response = await fetch(`https://api.zoom.us/v2/users/${zoomUserId}/meetings `, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${decryptedAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic,
                type,
                start_time,
                duration,
                settings: {
                    host_video: true,
                    participant_video: false,
                    join_before_host: false,
                    mute_upon_entry: true,
                    use_pmi: false,
                    approval_type: 0,
                    audio: "both",
                    auto_recording: "cloud"
                }
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Access token alınamadı: ${errorText}`);
        }
        return await response.json()
    } catch (error) {
        console.error(error)
        throw error
    }
}