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

export const getClassEvents = async (classId, monthKey) => {
    try {
        const { startDate, endDate } = dateRange(monthKey)
        return await Event.find({
            classId,
            visibility: 'class',
            startDate: { $gte: startDate, $lte: endDate }
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}