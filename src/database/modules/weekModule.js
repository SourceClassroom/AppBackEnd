import {Week} from "../models/weekModel.js";
import {Class} from "../models/classModel.js";

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
        return await Week.findById(weekId).select("title classroom description startDate endDate").where('isDeleted').equals(false);
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getMultiWeeks = async (weekIds) => {
    try {
        return await Week.find({ _id: { $in: weekIds }, isDeleted: false }).select("title classroom description startDate endDate");
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

export const pushMaterialToWeek = async (weekId, materialId) => {
    try {
        return await Week.findByIdAndUpdate(weekId, { $push: { materials: materialId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getWeekMaterials = async (weekId) => {
    try {
        const data = await Week.findById(weekId).select("materials")
        return data?.materials?.reverse()  || null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getWeekPosts = async (weekId) => {
    try {
        const data = await Week.findById(weekId).select("posts")
        return data?.posts?.reverse()  || null
    } catch (error) {
        console.log(error)
        throw error
    }
}
export const getWeekAssignments = async (weekId) => {
    try {
        const data = await Week.findById(weekId).select("assignments")
        return data?.assignments?.reverse()      || null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getWeekLessons = async (weekId) => {
    try {
        const data = await Week.findById(weekId).select("lessons")
        return data?.lessons?.reverse()  || null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const deleteWeek = async (weekId, deletedBy) => {
    try {
        return await Week.findByIdAndUpdate(weekId, { isDeleted: true, deletedBy, deletedAt: new Date() }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}