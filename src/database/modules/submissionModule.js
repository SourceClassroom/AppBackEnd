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

export const createSubmission = async (submissionData) => {
    try {
         return await Submission.create(submissionData);
    } catch (error) {
        throw new Error('Gönderim oluşturulurken bir hata meydana geldi.');
    }
}