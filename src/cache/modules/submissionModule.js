import getOrSet from "../strategies/getOrSet.js";

const SUBMISSION_KEY = (submissionId) => `submission:${submissionId}`

export const getCachedSubmissionById = async (submissionId, fetchFn) => {
    try {
        return await getOrSet(SUBMISSION_KEY(submissionId), () => fetchFn(submissionId), 3600);
    } catch (error) {
        throw error;
    }
}

export const getCachedUserSubmissions = async (userId, assignmentId, fetchFn) => {
    try {
        return await getOrSet(`user:${userId}:submission:${assignmentId}`, () => fetchFn(userId, assignmentId), 3600);
    } catch (error) {
        throw error;
    }
}