import {Week} from "../models/weekModel.js";

export const getWeekById = async (weekId) => {
    try {
        return await Week.findById(weekId).select("title description startDate endDate classroom");
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getAssignmentsByWeekId = async (weekId) => {
    try {
        const weekData = await Week.findById(weekId)
            .populate({
                path: 'assignments',
                populate: {
                    path: 'attachments',
                    select: '_id size originalname'
                },
                select: 'title description dueDate createdAt'
            });

        return weekData?.assignments || null;
    } catch (error) {
        console.log(error)
        return error
    }
}

export const pushAssignmentToWeek = async (weekId, assignmentId) => {
    try {
        return await Week.findByIdAndUpdate(weekId, { $push: { assignments: assignmentId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}