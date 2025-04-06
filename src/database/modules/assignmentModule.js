import { Assignment } from "../models/assignmentModel.js";

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