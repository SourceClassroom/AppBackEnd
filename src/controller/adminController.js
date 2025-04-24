import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as userCahceModule from "../cache/modules/userModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";
import {getPendingUserCount} from "../database/modules/userModule.js";


export const getUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const userIds = await userDatabaseModule.getUsersPaginated(offset, limit);
        const totalUsers = await userDatabaseModule.getUserCount()

        const totalPages = Math.ceil(totalUsers / limit);

        if (page > totalPages && totalUsers > 0) {
            return res.status(200).json(ApiResponse.paginated("Bu sayfa için kullanıcı bulunamadı.", [], { page, limit, totalDocs: totalUsers, totalPages }));
        }

        const users = await multiGet(userIds, "user", userDatabaseModule.getMultiUserById);

        res.status(200).json(ApiResponse.paginated("Kullanıcılar başarıyla getirildi.", users, {page, limit, totalDocs: totalUsers,totalPages}));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json(ApiResponse.serverError("Kullanıcılar getirilirken bir hata meydana geldi.", error));
    }
};

export const getPendingUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const userIds = await userDatabaseModule.getPendingUsersPaginated(offset, limit);
        const totalUsers = await userDatabaseModule.getPendingUserCount()

        const totalPages = Math.ceil(totalUsers / limit);

        if (page > totalPages && totalUsers > 0) {
            return res.status(200).json(ApiResponse.paginated("Bu sayfa için kullanıcı bulunamadı.", [], { page, limit, totalDocs: totalUsers, totalPages }));
        }

        const users = await multiGet(userIds, "user", userDatabaseModule.getMultiUserById);

        res.status(200).json(ApiResponse.paginated("Kullanıcılar başarıyla getirildi.", users, {page, limit, totalDocs: totalUsers, totalPages}));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json(ApiResponse.serverError("Kullanıcılar getirilirken bir hata meydana geldi.", error));
    }
};

export const getClasses = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page)) || 1;
        const limit = 6;
        const offset = (page - 1) * limit;

        const classIds = await classDatabaseModule.getClassesPaginated(offset, limit);
        const totalClasses = await classDatabaseModule.getClassCount()

        const totalPages = Math.ceil(totalClasses / limit);

        if (page > totalPages && totalClasses > 0) {
            return res.status(200).json(ApiResponse.paginated("Bu sayfa için kullanıcı bulunamadı.", [], { page, limit, totalDocs: totalUsers, totalPages }));
        }

        const classes = await multiGet(classIds, "class", classDatabaseModule.getMultiClassById)

        return res.status(200).json(ApiResponse.paginated("Sınıflar başarıyla getirildi.", classes, {page, limit, totalDocs: totalClasses, totalPages}))
    } catch (error) {
        console.error('Sınıflar alınırken bir hata meydana geldi:', error);
        res.status(500).json(ApiResponse.serverError("Sınıflar alınırken bir hata meydana geldi.", error));
    }
}
export const searchUsers = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        const page = Math.max(1, parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { userIds, totalResults } = await userDatabaseModule.searchUsers(searchTerm, limit, offset);

        const totalPages = Math.ceil(totalResults / limit);

        if (page > totalPages && totalResults > 0) {
            return res.status(200).json(ApiResponse.paginated("Bu sayfa için kullanıcı bulunamadı.", [], { page, limit, totalDocs: totalResults, totalPages }));
        }

        const users = await multiGet(userIds, "user", userDatabaseModule.getMultiUserById);

        res.status(200).json(ApiResponse.paginated("Kullanıcılar başarıyla getirildi.", users, {page, limit, totalDocs: totalResults, totalPages}));
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json(ApiResponse.serverError("Kullanıcılar getirilirken bir hata meydana geldi.", error));
    }
};

export const updateUser = async (req, res) => {
    try {
        const {userId, data} = req.body
        const newUser = await userDatabaseModule.updateUserForAdmin(userId, data)
        if (!newUser) {
            return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."));
        }
        await invalidateKey(`user:${userId}`)
        return res.status(200).json(ApiResponse.success("Kullanıcı başarıyla güncellendi.", newUser))
    } catch (error) {
        console.error("Kullanıcı güncelleme hatası:", error)
        res.status(500).json(ApiResponse.serverError("Kullanıcı güncellenirken bir hata meydana geldi.", error))
    }
}

export const updateUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        const user = await userDatabaseModule.updateUserStatus(userId, status)
        if (!user) {
            return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."));
        }
        await invalidateKey(`user:${userId}`)
        return res.status(200).json(ApiResponse.success("Kullanıcı başarıyla güncellendi.", user))
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json(ApiResponse.serverError("Kullanıcı güncellenirken bir hata meydana geldi.", error));
    }
};
