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
        const assignmentData = await Assignment.findById(assignmentId, "submissions")
        return assignmentData?.submissions?.reverse()
    } catch (error) {
        throw error;
    }
};

export const getMultiAssignments = async (assignmentIds) => {
    try {
        return await Assignment.find({ _id: { $in: assignmentIds }, isDeleted: false })
            .populate({
                path: "attachments",
                select: "originalname size"
            })
            .sort({ createdAt: -1 });
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

export const deleteAssignment = async (assignmentId, userId) => {
    try {
        return await Assignment.findByIdAndUpdate(assignmentId, { isDeleted: true, deletedBy: userId, deletedAt: new Date() }, { new: true });
    } catch (error) {
        throw error;
    }
};