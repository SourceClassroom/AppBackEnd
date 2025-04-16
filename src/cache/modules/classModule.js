import getOrSet from "../strategies/getOrSet.js";

const CLASS_KEY = (classId) => `class:${classId}`

export const getCachedClassData = async (classId, fetchFn) => {
    try {
        return await getOrSet(CLASS_KEY(classId), () => fetchFn(classId), 3600)
    } catch (error) {
        console .log(error)
        throw error;
    }
}

export const getCachedStudentList = async (classId, fetchFn) => {
    try {
        return await getOrSet(`${CLASS_KEY(classId)}:students`, () => fetchFn(classId), 3600)
    } catch (error) {
        console .log(error)
        throw error;
    }
}

export const getCachedClassAssignments = async (classId, fetchFn) => {
    try {
        return await getOrSet(`${CLASS_KEY(classId)}:assignments`, () => fetchFn(classId), 3600)
    } catch (error) {
        throw error;
    }
}

export const getCachedClassPosts = async (classId, fetchFn) => {
    try {
        return await getOrSet(`${CLASS_KEY(classId)}:posts`, () => fetchFn(classId), 3600)
    } catch (error) {
        throw error;
    }
}
export const getClassWeeks = async (classId, fetchFn) => {
    try {
        return await getOrSet(`${CLASS_KEY(classId)}:weeks`, () => fetchFn(classId), 3600)
    } catch (error) {
        throw error;
    }
}