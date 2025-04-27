import ApiResponse from "../utils/apiResponse.js";
import {Class} from "../database/models/classModel.js";

//Cache Modules
import *as attachmentCacheModule from "../cache/modules/attachmentModule.js";

//Database Modules
import *as attachmentDatabaseModule from "../database/modules/attachmentModule.js";

/**
 * Kullanıcının belirli rollere sahip olup olmadığını kontrol eden middleware
 * @param {string[]} allowedRoles - İzin verilen roller dizisi ('sysadmin', 'teacher', 'student' vb.)
 * @returns {Function} - Express middleware fonksiyonu
 */
export const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Auth middleware'inden gelen user nesnesine erişim
            // Auth middleware bu middleware'den önce çalıştırılmalıdır
            const { user } = req;
            // Kullanıcı nesnesi yoksa hata dön
            if (!user) {
                return res.status(401).json(ApiResponse.unauthorized("Kullanıcı oturumu bulunamadı."))

            }

            // Kullanıcının rolü izin verilen roller arasında mı kontrol et
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json(ApiResponse.forbidden("Bu işlem için gerekli izniniz bulunmamaktadır"));
            }

            // Kullanıcı yetkili, sonraki middleware'e veya route handler'a geç
            next();
        } catch (error) {
            return res.status(500).json(ApiResponse.serverError("Rol kontrolü sırasında bir hata oluştu", error));
        }
    };
};

/**
 * Belirli bir sınıfta öğretmen veya sysadmin olup olmadığını kontrol eden middleware
 * @returns {Function} - Express middleware fonksiyonu
 */
export const isClassTeacherOrOwner = () => {
    return async (req, res, next) => {
        try {
            const { user } = req;
            const userId = user._id.toString();
            const classId = req.params.classId || req.body.classId;

            if (!classId) {
                return res.status(400).json(ApiResponse.error("Lütfen geçerli bir sınıf ID'si belirtin"));
            }

            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json(ApiResponse.error("Belirtilen ID ile eşleşen sınıf bulunamadı"));
            }

            // Kullanıcı bu sınıfın öğretmeni veya sysadmin mi kontrol et
            if (
                (user.role === 'teacher' && classDoc.teacher.toString() === userId) ||
                (user.role === 'sysadmin')
            ) {
                // Sınıf nesnesini request'e ekle (sonraki middleware'ler için kullanışlı olabilir)
                req.classDoc = classDoc;
                return next();
            }

            return res.status(403).json(ApiResponse.forbidden("Bu işlem için gerekli izniniz bulunmamaktadır"));
        } catch (error) {
            return res.status(500).json(ApiResponse.serverError("Rol kontrolü sırasında bir hata oluştu", error));
        }
    };
};

/**
 * Kullanıcının sınıfın bir üyesi olup olmadığını kontrol eden middleware
 * @returns {Function} - Express middleware fonksiyonu
 */
export const isClassMember = () => {
    return async (req, res, next) => {
        try {
            const { user } = req;
            const classId = req.params.classId || req.body.classId;

            if (!classId) {
                return res.status(400).json(ApiResponse.error("Lütfen geçerli bir sınıf ID'si belirtin"));
            }

            // Class modelini import et
            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json(ApiResponse.error("Belirtilen ID ile eşleşen sınıf bulunamadı"));
            }
            // Kullanıcı bu sınıfın öğretmeni, üyesi veya sysadmin mi kontrol et
            if (
                (user.role === 'teacher' && classDoc.teacher.toString() === user.id) ||
                (classDoc.students.includes(user.id)) ||
                (user.role === 'sysadmin')
            ) {
                // Sınıf nesnesini request'e ekle
                req.classDoc = classDoc;
                return next();
            }

            return res.status(403).json(ApiResponse.forbidden("Bu işlem için gerekli izniniz bulunmamaktadır"));
        } catch (error) {
            return res.status(500).json(ApiResponse.serverError("Rol kontrolü sırasında bir hata oluştu", error));
        }
    };
};

export const isSysadmin = () => {
    return async (req, res, next) => {
        try {
            const { user } = req;

            if (user.role === 'sysadmin') {
                return next();
            }

            return res.status(403).json(ApiResponse.forbidden("Bu işlem için gerekli izniniz bulunmamaktadır"));
        } catch (error) {
            return res.status(500).json(ApiResponse.serverError("Rol kontrolü sırasında bir hata oluştu", error));
        }
    };
};

export const checkFilePermission = (userIdField = 'userId', attachmentIdField = 'id') => {
    return async (req, res, next) => {
        try {
            const { user } = req;
            const attachmentId = req.body[attachmentIdField] || req.params[attachmentIdField];
            const cacheKey = `attachment:${attachmentId}`;

            if (!attachmentId) {
                return res.status(400).json(ApiResponse.error("Lütfen geçerli bir dosya ID'si belirtin"));
            }

            // Admin her şeyi yapabilir
            if (user.role === 'sysadmin') {
                return next();
            }

            // Cache kontrolü
            let attachmentData = await attachmentCacheModule.getCachedAttachmentData(attachmentId, attachmentDatabaseModule.getAttachmentById)

            const { permission, classroom } = attachmentData;

            if (permission === 1) {
                if (!classroom) return res.status(400).json(ApiResponse.error("Sınıf verisi bulunamadı lütfen bir sistem yöneticisi ile iletişime geçin."))
                req.params.classId = classroom
                return isClassMember()(req, res, next);
            } else if (permission === 2) {
                req.params.classId = classroom
                if (!classroom) return res.status(400).json(ApiResponse.error("Sınıf verisi bulunamadı lütfen bir sistem yöneticisi ile iletişime geçin."))
                if (attachmentData.userId === user.id) return next()
                return isClassTeacherOrOwner()(req, res, next);
            }
            // TODO: Chat dosyaları için yetkilendirme eklenebilir
            return next();

        } catch (error) {
            console.error(error);
            return res.status(500).json(ApiResponse.serverError("Dosya yetkilendirme kontrolü sırasında bir hata oluştu", error));
        }
    };
};

