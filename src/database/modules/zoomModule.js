import { Zoom } from "../models/zoomModel.js";

export const updateRefreshToken = async (userId, refreshToken) => {
    try {
        return await Zoom.findOneAndUpdate({user: userId}, {$set: {refreshToken}}, {new: true, upsert: true})
    } catch (error) {
        throw error
    }
}

export const getUserRefreshToken = async (userId) => {
    try {
        const user = await Zoom.findOne({user: userId})
        return user.refreshToken
    } catch (error) {
        throw error
    }
}