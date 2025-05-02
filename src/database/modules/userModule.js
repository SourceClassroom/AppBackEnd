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
        return await User.findOne({ _id: userId, isDeleted: false }).select("-password")
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUserByEmail = async (email) => {
    try {
        return await User.findOne({ email, isDeleted: false }).select("_id")
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const verifyUser = async (email) => {
    try {
        return await User.findOneAndUpdate({email}, { $set: { accountStatus: "active", mailVerification: true} }, { new: true }).select("-password");
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
        return await User.findById(userId, "name surname email role profile enrolledClasses teachingClasses").lean()
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getMultiUserById = async (userIds) => {
    try {
        return await User.find({ _id: { $in: userIds } }).select("-password")
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

export const pushNewTeachingClass = async (userId, classId) => {
    try {
        return await User.findByIdAndUpdate(userId, { $push: { teachingClasses: classId } }, { new: true });
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

export const updateUserStatus = async (userId, status) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: { accountStatus: status } }, { new: true }).select("-password");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getUsersPaginated = async (offset, limit) => {
    try {
        return  await User.find().skip(offset).limit(limit).select("_id");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getPendingUsersPaginated = async (offset, limit) => {
    try {
        return  await User.find({ accountStatus: "pending" }).skip(offset).limit(limit).select("_id");
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const searchUsers = async (searchTerm, limit = 15, offset = 0) => {
    try {
        // Arama terimini boşluklardan ayır, trim'le ve küçük parçalara böl
        const searchParts = searchTerm.trim().split(/\s+/);

        // Her parçayı name veya surname'de aramak için $or yapısı oluştur
        const orQueries = searchParts.flatMap(part => [
            { name: { $regex: part, $options: "i" } },
            { surname: { $regex: part, $options: "i" } }
        ]);

        const query = { $or: orQueries };

        // Eşleşen kullanıcıları getir
        const userIds = await User.find(query)
            .skip(offset)
            .limit(limit)
            .select("_id");

        // Toplam sonuç sayısını al
        const totalResults = await User.countDocuments(query);

        return { userIds, totalResults };
    } catch (error) {
       console.error(error)
       throw error
    }
}

export const updateUserForAdmin = async (userId, data) => {
    try {
        return await User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
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

export const getPendingUserCount = async () => {
    try {
        return await User.countDocuments({ accountStatus: "pending" })
    } catch (error) {
        console.log(error)
        throw error
    }
}