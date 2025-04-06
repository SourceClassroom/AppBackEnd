import getOrSet from "../strategies/getOrSet.js";
import { client } from "../client/redisClient.js";

const CLASS_KEY = (classId) => `class:${classId}`

export const getCachedClassData = async (classId, fetchFn) => {
    try {
        return await getOrSet(CLASS_KEY(classId), () => fetchFn(classId), 3600)
    } catch (error) {
        console .log(error)
        return error
    }
}

export const getCachedStudentList = async (classId, fetchFn) => {
    try {
        return await getOrSet(`${CLASS_KEY(classId)}:students`, () => fetchFn(classId), 3600)
    } catch (error) {
        console .log(error)
        return error
    }
}