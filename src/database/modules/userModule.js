import { User } from "../models/userModel.js";

export const createUser = async (userData) => {
    try {
        return await User.create(userData)
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUserById = async (userId) => {
    try {
        return await User.findById(userId).select("-password")
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUserByEmail = async (email) => {
    try {
        return await User.findOne({ email }).select("_id")
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const changePassword = async (userId, password, tokenVersion) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: { password, tokenVersion } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const changeEmail = async (userId, email) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: { email } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const changeAvatar = async (userId, avatar) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: { "profile.avatar": avatar } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const updateProfile = async (userId, data) => {
    try {
        const { name, surname, profile } = data
        return await User.findByIdAndUpdate(userId, { $set: { name, surname, profile } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const updateNotificationPreferences = async (userId, notificationPreferences) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: { notificationPreferences } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUserLoginData = async (email) => {
    try {
        return await User.findOne({email}).select('_id email password accountStatus role')
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUserDashboard = async (userId) => {
    try {
        return await User.findById(userId, "name surname email role profile")
            .populate({
                path: "enrolledClasses",
                select: "title description"
            })
            .populate({
                path: "teachingClasses",
                select: "title description code"
            })

    } catch (error) {
        console.log(error)
        throw error
    }
}

export const pushNewEnrolledClass = async (userId, classId) => {
    try {
        return await User.findByIdAndUpdate(userId, { $push: { enrolledClasses: classId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const removeClassFromEnrolledClasses = async (userId, classId) => {
    try {
        return await User.findByIdAndUpdate(userId, { $pull: { enrolledClasses: classId } }, { new: true });
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const updateLastLogin = async (userId) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: { lastLogin: new Date() } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUserCount = async () => {
    try {
        return await User.countDocuments()
    } catch (error) {
        console.log(error)
        throw error
    }
}