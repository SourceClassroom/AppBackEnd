import { Event } from "../models/eventModel.js";
import { getMonthKey } from "../../utils/dateRange.js";

export const createEvent = async (eventData) => {
    try {
        return await Event.create(eventData)
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const getEvents = async (id, monthKey) => {
    try {
        const { start, end } = getMonthKey(monthKey)

        return await Event.find({
            $or: [
                { userId: id },
                { classId: id }
            ],
            date: { $gte: start, $lte: end }
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}