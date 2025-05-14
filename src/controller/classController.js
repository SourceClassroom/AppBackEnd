import ApiResponse from "../utils/apiResponse.js";
import { generateUniqueCode } from "../services/randomCodeService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import { invalidateKey, invalidateKeys } from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as userCacheHandler from "../cache/handlers/userCacheHandler.js";
import *as classCacheHandler from '../cache/handlers/classCacheHandler.js';

//Database Repositories
import *as userDatabaseRepository from "../database/repositories/userRepository.js";
import *as classDatabaseRepository from '../database/repositories/classRepository.js';

export const getClass = async (req, res) => {
    try {
        const classId = req.params.classId;

        const getClass = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)
        if (!getClass) return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));

        const formatData = {
            _id: getClass._id,
            title: getClass.title,
            description: getClass.description,
            code: getClass.code,
            teacher: getClass.teacher
        }

        return res.status(200).json(ApiResponse.success("Sınıf bilgisi.", formatData, 200));
    } catch (error) {
        console.error('Sınıf görüntüleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf bilgisi alınırken bir hata meydana geldi.', error)
        );
    }
}

/**
 * Sınıf oluşturma
 * @route POST /api/class/create
 * @access Private [Teacher/sysadmin]
 */
export const createClass = async (req, res) => {
    try {
        const { title } = req.body;
        //Sınıfı oluşturan kullanıcının idsi
        const teacher = req.user.id;
        //Daha önce oluşturulmamış bir kod al
        const newCode = await generateUniqueCode()
        //Oluşturualcak sınıf datası
        const classData = {
            title,
            description: req.body?.description || "",
            code: newCode,
            teacher
        }
        //Class oluştur
        const newClass = await classDatabaseRepository.createClass(classData)

        //Kullanıcının öğretim yaptığı sınıfları güncelle
        const updatedTeacher = await userDatabaseRepository.pushNewTeachingClass(teacher, newClass._id)

        await userCacheHandler.clearUserCache(teacher)
        return res.status(201).json(
            ApiResponse.success("Sınıf başarılı bir şekilde oluşturuldu.", {updatedTeacher, newClass})
        );
    } catch (error) {
        console.error('Sınıf oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf oluşturulurken bir hata oluştu', error)
        );
    }
}

export const updateClass = async (req, res) => {
    try {
        const classId = req.params.classId;
        const { title, description } = req.body;

        const getClassData = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const updateClassData = {
            title,
            description
        };
        await invalidateKey(`class:${classId}`)
        const updateClass = await classDatabaseRepository.updateClassById(classId, updateClassData)
        await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)
        return res.status(200).json(ApiResponse.success("Sınıf başarıyla güncellendi.", updateClass, 200));
    } catch (error) {
        console.error('Sınıf güncelleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf güncellenirken bir hata oluştu', error)
        );
    }
}

export const deleteClass = async (req, res) => {
    try {
        const classId = req.params.classId;
        const getClassData = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const deleteClass = await classDatabaseRepository.deleteClassById(classId, req.user.id)
        await classCacheHandler.clearClassCache(classId)
        return res.status(200).json(ApiResponse.success("Sınıf başarıyla silindi.", deleteClass, 200));
    } catch (error) {
        console.error('Sınıf silme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf silinirken bir hata oluştu', error)
        );
    }
}

/**
 * Sınıfa katılma
 * @route POST /api/class/join
 * @access Private
 */
export const joinClass = async (req, res) => {
    try {
        const classCode = req.params.classCode;
        const userId = req.user.id;
        //Get Class Data
        const getClassData = await classDatabaseRepository.getClassByCode(classCode)
        //Check Class is avalible
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."))
        }
        if (getClassData.forbiddenStudents.includes(userId)) return res.status(403).json(ApiResponse.forbidden("Bu sınıfa katılma izniniz yok."))

        const classId = getClassData._id.toString();

        //Get user data
        const userData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById);
        //Check for user already member of class
        if (userData.enrolledClasses.includes(classId) || userData.teachingClasses.includes(classId)) {
            return res.status(400).json(ApiResponse.error("Kullanıcı zaten bu sınıfa üye.",  null, 400))
        }
        //Update class students
        const updateClass = await classDatabaseRepository.pushNewStudent(classId, userId)
        //Update user classes
        const updateUser = await userDatabaseRepository.pushNewEnrolledClass(userId, classId)

        //Clear cache
        await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`, `class:${classId}`, `class:${classId}:students`])

        //return data
        res.status(200).json(ApiResponse.success("Başarıyla sınıfa katılındı.", {updateUser}, 200))
    } catch (error) {
        console.error('Sınıf katılma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıfa katılırken bir hata meydana geldi', error)
        );
    }
}

/**
 * Öğrenci at
 * @route POST /api/class/kick/:classId/:userId
 * @access Private [Class Teacher/sysadmin]
 */
export const kickStudent = async (req, res) => {
    try {
        const userId = req.params.userId;
        const classId = req.params.classId;

        // Sınıf verisini al
        const getClassData = await classCacheHandler.getCachedStudentList(classId, classDatabaseRepository.getStudentsByClassId)
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }

        // Kullanıcı verisini al
        const userData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById);
        if (!userData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir kullanıcı bulunamadı."));
        }

        // Kullanıcı gerçekten sınıfın bir üyesi mi kontrol et

        if (!getClassData.some(student => student._id.toString() === userData._id.toString())) {
            return res.status(400).json(ApiResponse.error("Kullanıcı bu sınıfın üyesi değil", null, 400));
        }
        // Kullanıcıdan sınıfı kaldır
        const updateUser = await userDatabaseRepository.removeClassFromEnrolledClasses(userId, classId)

        // Sınıftan kullanıcıyı kaldır
        const updateClass = await classDatabaseRepository.removeStudentFromClass(classId, userId)

        //Clear cache
        await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`, `class:${classId}`, `class:${classId}:students`])

        return res.status(200).json(ApiResponse.success("Kullanıcı sınıftan başarıyla çıkarıldı.", {updateClass, updateUser}));
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json(
            ApiResponse.serverError('Bir hata meydana geldi', error)
        );
    }
};

/**
 * Öğrenci yasakla
 * @route POST /api/class/kick/:classId/:userId
 * @access Private [Class Teacher/sysadmin]
 */
export const banStudent = async (req, res) => {
    try {
        const userId = req.params.userId;
        const classId = req.params.classId;

        // Sınıf verisini al
        const getClassData = await classCacheHandler.getCachedStudentList(classId, classDatabaseRepository.getStudentsByClassId)
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }

        // Kullanıcı verisini al
        const userData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById);
        if (!userData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir kullanıcı bulunamadı."));
        }

        // Kullanıcı gerçekten sınıfın bir üyesi mi kontrol et
        if (!getClassData.some(student => student._id.toString() === userData._id.toString())) {
            return res.status(400).json(ApiResponse.error("Kullanıcı bu sınıfın üyesi değil", null, 400));
        }

        // Kullanıcıdan sınıfı kaldır
        const updateUser = await userDatabaseRepository.removeClassFromEnrolledClasses(userId, classId)

        // Sınıftan kullanıcıyı kaldır
        await classDatabaseRepository.removeStudentFromClass(classId, userId);

        //Kullanıcıyı engelle
        const newClassData = await classDatabaseRepository.pushForbiddenStudents(classId, userId)

        //Clear cache
        await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`, `class:${classId}`, `class:${classId}:students`])

        return res.status(200).json(ApiResponse.success("Kullanıcı sınıftan başarıyla çıkarıldı.", {newClassData, updateUser}));
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json(
            ApiResponse.serverError('Bir hata meydana geldi', error)
        );
    }
};
/** Sınıftaki öğrencilerin bilgilerini döner
 * @param {*} req
 * @param {*} res
 */
export const studentList = async (req, res) => {
    try {
        const classId = req.params.classId

        //Ogrenci Id verisi al
        const getStudentIds = await classCacheHandler.getCachedStudentList(classId, classDatabaseRepository.getStudentsByClassId)
        if (!getStudentIds) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }

        const studentData = await multiGet(getStudentIds, "user", userDatabaseRepository.getMultiUserById)

        const formattedStudentData = studentData.map(student => ({
            _id: student._id,
            name: student.name,
            surname: student.surname,
            profile: student.profile
        }))

        return res.status(200).json(ApiResponse.success("Sınıftaki öğrenci verisi", formattedStudentData, 200))
    } catch (error) {
        console.error('Öğrenci bilgileri alınırken bir hata meydana geldi.:', error);
        res.status(500).json(
            ApiResponse.serverError('Öğrenci bilgileri alınırken bir hata meydana geldi.', error)
        );
    }
}

export const leaveClass = async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = req.user.id;

        // Sınıf verisini al
        const getClassData = await classCacheHandler.getCachedStudentList(classId, classDatabaseRepository.getStudentsByClassId)
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }

        // Kullanıcı verisini al
        const userData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById);
        if (!userData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir kullanıcı bulunamadı."));
        }

        // Kullanıcı gerçekten sınıfın bir üyesi mi kontrol et
        if (!getClassData.some(student => student._id.toString() === userData._id.toString())) {
            return res.status(400).json(ApiResponse.error("Kullanıcı bu sınıfın üyesi değil", null, 400));
        }

        // Kullanıcıdan sınıfı kaldır
        const updateUser = await userDatabaseRepository.removeClassFromEnrolledClasses(userId, classId)

        // Sınıftan kullanıcıyı kaldır
        await classDatabaseRepository.removeStudentFromClass(classId, userId)

        //Clear cache
        await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`, `class:${classId}`, `class:${classId}:students`])


        return res.status(200).json(ApiResponse.success("Kullanıcı sınıftan başarıyla çıkarıldı.", updateUser));
    } catch (error) {
        console.error('Sınıftan ayrılırken bir hata meydana geldi:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıftan ayrılırken bir hata meydana geldi.', error)
        );
    }
};