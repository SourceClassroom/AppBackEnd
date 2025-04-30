import getOrSet from "../strategies/getOrSet.js";

const LESSON_KEY = (lessonId) => `lesson:${lessonId}`

export const getCachedLessonData = async (lessonId, fetchFn) => {
    try {
        return await getOrSet(LESSON_KEY(lessonId), () => fetchFn(lessonId));
    } catch (error) {
        console.error(error)
        throw error
    }
}