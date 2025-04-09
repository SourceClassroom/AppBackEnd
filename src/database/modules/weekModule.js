import {Week} from "../models/weekModel.js";

export const createWeek = async (weekData) => {
    try {
        return await Week.create(weekData);
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const updateWeek = async (weekId, weekData) => {
    try {
        return await Week.findByIdAndUpdate(weekId, weekData, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getWeekById = async (weekId) => {
    try {
        return await Week.findById(weekId).select("title description startDate endDate classroom");
    } catch (error) {
        console.log(error)
        throw error
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
        throw error
    }
}

export const pushAssignmentToWeek = async (weekId, assignmentId) => {
    try {
        return await Week.findByIdAndUpdate(weekId, { $push: { assignments: assignmentId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushPostToWeek = async (weekId, postId) => {
    try {
        return await Week.findByIdAndUpdate(weekId, { $push: { posts: postId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getWeekPosts = async (weekId) => {
    try {
        const weekData = await Week.findById(weekId)
            .populate({
                path: 'posts',
                populate: {
                    path: 'attachments',
                    select: '_id size originalname'
                },
                select: 'title content comments createdAt'
            });

        return weekData?.posts || null;
    } catch (error) {
        console.log(error)
        throw error
    }
}