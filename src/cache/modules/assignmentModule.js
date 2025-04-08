import { client } from "../client/redisClient.js";
import getOrSetCache from "../strategies/getOrSet.js";
import { invalidateKey } from "../strategies/invalidate.js";

const ASSIGNMENT_KEY = (assignmentId) => `assignment:${assignmentId}`;
const WEEK_ASSIGNMENTS_KEY = (weekId) => `week:${weekId}:assignments`;
const CLASS_ASSIGNMENTS_KEY = (classId) => `class:${classId}:assignments`;

export const getCachedAssignment = async (assignmentId, fetchFn) => {
    try {
        return await getOrSetCache(ASSIGNMENT_KEY(assignmentId), () => fetchFn(assignmentId), 3600);
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getCachedClassAssignments = async (classId, fetchFn) => {
    try {
        return await getOrSetCache(CLASS_ASSIGNMENTS_KEY(classId),  () => fetchFn(classId), 3600);
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getCachedWeekAssignments = async (weekId, fetchFn) => {
    try {
        return await getOrSetCache(WEEK_ASSIGNMENTS_KEY(weekId), () => fetchFn(weekId), 3600);
    } catch (error) {
        console.log(error)
        return error
    }
}

export const writeAssignmnetToCacheByClass = async (classId, assignments, ttl = 3600) => {
    try {
        await client.setEx(CLASS_ASSIGNMENTS_KEY(classId), ttl, JSON.stringify(assignments));
    } catch (error) {
        console.log(error)
        return error
    }
}

export const writeAssignmnetToCacheByWeek = async (weekId, assignments, ttl = 3600) => {
    try {
        await client.setEx(WEEK_ASSIGNMENTS_KEY(weekId), ttl, JSON.stringify(assignments));
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getCachedSubmissions = async (assignmentId, fetchFn) => {
    try {
        return await getOrSetCache(`assignment:${assignmentId}:submissions`, () => fetchFn(assignmentId), 3600);
    } catch (error) {
        console.log(error)
        return error
    }
}