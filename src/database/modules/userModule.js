import { User } from "../models/userModel.js";

export const getUserById = async (userId) => {
    try {
        return await User.findById(userId)
    } catch (error) {
        console.log(error)
        return error
    }
}

export const pushNewEnrolledClass = async (userId, classId) => {
    try {
        return await User.findByIdAndUpdate(userId, { $push: { enrolledClasses: classId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}

export const removeClassFromEnrolledClasses = async (userId, classId) => {
    try {
        return await User.findByIdAndUpdate(userId, { $pull: { enrolledClasses: classId } }, { new: true });
    } catch (error) {
        console.log(error)
        return error
    }
}