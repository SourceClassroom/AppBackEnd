import {Assignment} from '../models/assignmentModel.js';

export const getAssignmentById = async (assignmentId) => {
    try {
        return await Assignment.findById(assignmentId);
    } catch (error) {
        throw error;
    }
};

export const createAssignment = async (data) => {
    try {
        return await Assignment.create(data);
    } catch (error) {
        throw error;
    }
};

export const updateAssignment = async (assignmentId, data) => {
    try {
        return await Assignment.findByIdAndUpdate(assignmentId, data, { new: true });
    } catch (error) {
        throw error;
    }
};

export const getAssignmentSubmissions = async (assignmentId) => {
    try {
        return await Assignment.findById(assignmentId, "submissions")
            .populate({
                path: "submissions",
                populate: [{
                    path: "student",
                    select: "name surname profile.avatar"
                }, {
                    path: "attachments",
                    select: "originalname size"
                }],
                select: "description"
            });
    } catch (error) {
        throw error;
    }
};

export const pushSubmissionToAssignment = async (assignmentId, submissionId) => {
    try {
        return await Assignment.findByIdAndUpdate(
            assignmentId,
            { $push: { submissions: submissionId } },
            { new: true }
        );
    } catch (error) {
        throw error;
    }
};
