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
    } catch (error) {
        throw error;
    }
};

export const getClassAssignments = async (classId) => {
    try {
        return await Assignment.find({ class: classId }).select("_id").sort({ createdAt: -1 })
    } catch (error) {
        throw error;
    }
};

export const getWeekAssignments = async (weekId) => {
    try {
        return await Assignment.find({ week: weekId }).select("_id").sort({ createdAt: -1 })
    } catch (error) {
        throw error;
    }
};

export const getMultiAssignments = async (assignmentIds) => {
    try {
        return await Assignment.find({ _id: { $in: assignmentIds } })
            .populate({
                path: "attachments",
                select: "originalname size"
            })
            .select("title description dueDate createdAt")
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
