import { Meeting } from "../models/meetingModel.js";

export const createMeeting = async (data) => {
    try {
        return await Meeting.create(data);
    } catch (error) {
        throw error
    }
}