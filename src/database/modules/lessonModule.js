import { Lesson } from "../models/lessonModel.js";

export const createLesson = async (data) => {
  try {
    return await Lesson.create(data);
  } catch (error) {
    throw error
  }
};