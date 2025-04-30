import { Lesson } from "../models/lessonModel.js";

export const createLesson = async (data) => {
  try {
    return await Lesson.create(data);
  } catch (error) {
    throw error
  }
};

export const getLessonById = async (lessonId) => {
  try {
    return await Lesson.findOne({ _id: lessonId, isDeleted: false });
  } catch (error) {
    throw error
  }
};

export const getMultiLessonById = async (lessonIds) => {
  try {
    return await Lesson.find({ _id: { $in: lessonIds }, isDeleted: false });
  } catch (error) {
    throw error
  }
};

export const updateLessonStatus = async (lessonId, status) => {
  try {
    return await Lesson.findOneAndUpdate({ _id: lessonId }, { status }, { new: true });
  } catch (error) {
    throw error
  }
};