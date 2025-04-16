import getOrSetCache from "../strategies/getOrSet.js";

const ASSIGNMENT_KEY = (assignmentId) => `assignment:${assignmentId}`;

export const getCachedAssignment = async (assignmentId, fetchFn) => {
    try {
        return await getOrSetCache(ASSIGNMENT_KEY(assignmentId), () => fetchFn(assignmentId), 3600);
    } catch (error) {
        throw error;
    }
}
export const getCachedSubmissions = async (assignmentId, fetchFn) => {
    try {
        return await getOrSetCache(`${ASSIGNMENT_KEY(assignmentId)}:submissions`, () => fetchFn(assignmentId), 900);
    } catch (error) {
        throw error;
    }
}