import {Class} from "../models/classModel.js";

export const createClass = async (data) => {
    try {
        return await Class.create(data)
    } catch (error) {
        console.log(error)
        return error
    }
}

export const updateClassById = async (classId, data) => {
    try {
        return await Class.findByIdAndUpdate(classId, data, {new: true})
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getClassById = async (classId) => {
    try {
        return await Class.findById(classId)
            .populate({
                path: "teacher",
                select: "name surname email",
            })
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getClassByCode = async (code) => {
    try {
        return await Class.findOne({code: code})
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getStudentsByClassId = async (classId) => {
    try {
        const classData = await Class.findById(classId)
            .populate({
                path: 'students',
                select: 'name surname email profile.avatar',
            });

        return classData?.students || null;
    } catch (error) {
        console.log(error)
        return error
    }
}

export const pushNewStudent = async (classId, studentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { students: studentId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}

export const pushForbiddenStudents = async (classId, studentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { forbiddenStudents: studentId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}

export const removeStudentFromClass = async (classId, studentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $pull: { students: studentId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getAssignmentsByClassId = async (classId) => {
    try {
        const classData = await Class.findById(classId)
            .populate({
                path: 'assignments',
                populate: {
                    path: 'attachments',
                    select: '_id size originalname'
                },
                select: 'title description dueDate createdAt'
            });

        return classData?.assignments || null;
    } catch (error) {
        console.log(error)
        return error
    }
}

export const pushAssignmentToClass = async (classId, assignmentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { assignments: assignmentId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}