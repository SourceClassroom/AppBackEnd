import {Class} from "../models/classModel.js";

export const createClass = async (data) => {
    try {
        return await Class.create(data)
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const updateClassById = async (classId, data) => {
    try {
        return await Class.findByIdAndUpdate(classId, data, {new: true})
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassById = async (classId) => {
    try {
        await Class.findOne({ _id: classId, isDeleted: false })
            .populate({
                path: "teacher",
                select: "name surname email profile.avatar",
            })
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getMultiClassById = async (classIds) => {
    try {
        return await Class.find({ _id: { $in: classIds }, isDeleted: false })
            .populate({
                path: "teacher",
                select: "name surname email profile.avatar",
            })
            .select("title description code teacher createdAt")
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassesPaginated = async (offset, limit) => {
    try {
        return await Class.find().skip(offset).limit(limit).select("_id");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassByCode = async (code) => {
    try {
        return await Class.findOne({code: code, isDeleted: false})
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getStudentsByClassId = async (classId) => {
    try {
        const classData = await Class.findById(classId)
            .populate({
                path: 'students',
                select: '_id',
            });

        return classData?.students || null;
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getWeeksByClassId = async (classId) => {
    try {
        const classData = await Class.findById(classId).select("weeks")

        return classData?.weeks || null;
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushNewStudent = async (classId, studentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { students: studentId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushMaterialToClass = async (classId, materialId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { material: materialId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushPostToClass = async (classId, postId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { posts: postId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushForbiddenStudents = async (classId, studentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { forbiddenStudents: studentId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushWeekToClass = async (classId, weekId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { weeks: weekId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const removeStudentFromClass = async (classId, studentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $pull: { students: studentId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}
export const pushAssignmentToClass = async (classId, assignmentId) => {
    try {
        return await Class.findByIdAndUpdate(classId, { $push: { assignments: assignmentId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassMaterials = async (classId) => {
    try {
        const data = await Class.findById(classId).select("material")
        return data?.material?.reverse()  || null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassAssignments = async (classId) => {
    try {
        const data = await Class.findById(classId).select("assignments")
        return data?.assignments?.reverse() || null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassPosts = async (classId) => {
    try {
        const data = await Class.findById(classId).select("posts")
        return data?.posts ? data.posts.reverse() : null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassLessons = async (classId) => {
    try {
        const data = await Class.findById(classId).select("lessons")
        return data?.lessons ? data.lessons.reverse() : null
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getClassCount = async () => {
    try {
        return await Class.countDocuments()
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const deleteClassById = async (classId, deletedBy) => {
    try {
        return await Class.findByIdAndUpdate(classId, {isDeleted: true, deletedBy, deletedAt: new Date()})
    } catch (error) {
        console.log(error)
        throw error
    }
}