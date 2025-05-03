import { Event } from "../models/eventModel.js";
import dateRange from "../../utils/dateRange.js";

export const createEvent = async (eventData) => {
    try {
        return await Event.create(eventData)
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getEvents = async (userId, classIds, monthKey) => {
    try {
        const { startDate, endDate } = dateRange(monthKey)
        return await Event.find({
            $or: [
                { userId: userId },
                { classId: { $in: classIds } }
            ],
            startDate: { $gte: startDate, $lte: endDate }
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}