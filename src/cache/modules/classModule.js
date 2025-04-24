import getOrSet from "../strategies/getOrSet.js";
import scanAndDelete from "../strategies/scanAndDelete.js";

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

export const getCachedClassMaterials = async (classId, fetchFn) => {
    try {
        return await getOrSet(`${CLASS_KEY(classId)}:materials`, () => fetchFn(classId), 3600)
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

export const clearClassCache = async (classId) => {
    try {
        return await scanAndDelete(CLASS_KEY(classId));
    } catch (error) {
        console.error(`clearUserCache error (classId: ${classId}):`, error);
        throw error;
    }
}
