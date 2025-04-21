import {Submission} from "../models/submissionsModel.js";

export const getSubmissionById = async (submissionId) => {
    try {
        return await Submission.findById(submissionId)
            .populate({
                path: "student",
                select: "name surname profile.avatar"
            })
            .populate({
                path: "attachments",
                select: "originalname size"
            })
    } catch (error) {
        throw new Error('Gönderim verileri alınırken bir hata meydana geldi.');
    }
}

export const getUserSubmission = async (userId, assignmentId) => {
    try {
        return await Submission.findOne({student: userId, assignment: assignmentId})
            .populate({
                path: "attachments",
                select: "originalname size"
            })
    } catch (error) {
        throw new Error('Gönderim verileri alınırken bir hata meydana geldi.');
    }
}

export const createSubmission = async (submissionData) => {
    try {
         return await Submission.create(submissionData);
    } catch (error) {
        throw new Error('Gönderim oluşturulurken bir hata meydana geldi.');
    }
}

export const setReview = async (submissionId, feedback, grade) => {
    try {
        return await Submission.findByIdAndUpdate(submissionId, {$set: {feedback, grade}}, {new: true})
    } catch (error) {
        throw new Error('Feedback girilirken bir hata meydana geldi.');
    }
}

export const getMultiSubmissions = async (submissionIds) => {
    try {
        return await Submission.find({ _id: { $in: submissionIds } })
            .populate({
                path: "attachments",
                select: "originalname size"
            })
            .select("description grade feedback student createdAt")
    } catch (error) {
        throw error;
    }
};