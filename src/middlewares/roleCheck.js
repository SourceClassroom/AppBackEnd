import {Class} from "../database/models/classModel.js";

/**
 * Kullanıcının belirli rollere sahip olup olmadığını kontrol eden middleware
 * @param {string[]} allowedRoles - İzin verilen roller dizisi ('sysadmin', 'teacher', 'student' vb.)
 * @returns {Function} - Express middleware fonksiyonu
 */
const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Auth middleware'inden gelen user nesnesine erişim
            // Auth middleware bu middleware'den önce çalıştırılmalıdır
            const { user } = req.user;
            // Kullanıcı nesnesi yoksa hata dön
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli',
                    error: 'Kullanıcı oturumu bulunamadı'
                });
            }

            // Kullanıcının rolü izin verilen roller arasında mı kontrol et
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Yetkisiz erişim',
                    error: 'Bu işlem için gerekli izniniz bulunmamaktadır'
                });
            }

            // Kullanıcı yetkili, sonraki middleware'e veya route handler'a geç
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Rol kontrolü sırasında bir hata oluştu',
                error: error.message
            });
        }
    };
};

/**
 * Belirli bir sınıfta öğretmen veya sysadmin olup olmadığını kontrol eden middleware
 * @returns {Function} - Express middleware fonksiyonu
 */
const isClassTeacherOrOwner = () => {
    return async (req, res, next) => {
        try {
            const { user } = req.user;
            const classId = req.params.classId || req.body.classId;

            if (!classId) {
                return res.status(400).json({
                    success: false,
                    message: "Sınıf ID'si bulunamadı",
                    error: "Lütfen geçerli bir sınıf ID'si belirtin"
                });
            }

            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Sınıf bulunamadı',
                    error: 'Belirtilen ID ile eşleşen sınıf bulunamadı'
                });
            }

            // Kullanıcı bu sınıfın öğretmeni veya sysadmin mi kontrol et
            if (
                (user.role === 'teacher' && classDoc.teacher.toString() === user.id) ||
                (user.role === 'admin')
            ) {
                // Sınıf nesnesini request'e ekle (sonraki middleware'ler için kullanışlı olabilir)
                req.classDoc = classDoc;
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Yetkisiz erişim',
                error: 'Bu sınıf üzerinde işlem yapma yetkiniz bulunmamaktadır'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Sınıf yetkisi kontrolü sırasında bir hata oluştu',
                error: error.message
            });
        }
    };
};

/**
 * Kullanıcının sınıfın bir üyesi olup olmadığını kontrol eden middleware
 * @returns {Function} - Express middleware fonksiyonu
 */
const isClassMember = () => {
    return async (req, res, next) => {
        try {
            const { user } = req.user;
            const classId = req.params.classId;

            if (!classId) {
                return res.status(400).json({
                    success: false,
                    message: "Sınıf ID'si bulunamadı",
                    error: "Lütfen geçerli bir sınıf ID'si belirtin"
                });
            }

            // Class modelini import et
            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Sınıf bulunamadı',
                    error: 'Belirtilen ID ile eşleşen sınıf bulunamadı'
                });
            }

            // Kullanıcı bu sınıfın öğretmeni, üyesi veya sysadmin mi kontrol et
            console.log(user)
            console.log(classDoc.teacher.toString());
            if (
                (user.role === 'teacher' && classDoc.teacher.toString() === user.id) ||
                (user.role === 'student' && classDoc.students.includes(user.id)) ||
                (user.role === 'sysadmin')
            ) {
                // Sınıf nesnesini request'e ekle
                req.classDoc = classDoc;
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Yetkisiz erişim',
                error: 'Bu sınıfın bir üyesi değilsiniz'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Sınıf üyeliği kontrolü sırasında bir hata oluştu',
                error: error.message
            });
        }
    };
};

/**
 * Kullanıcının kendi kaynakları üzerinde işlem yapıp yapmadığını kontrol eden middleware
 * @param {string} userIdField - Kullanıcı ID'sinin bulunduğu alan (örn: 'userId', 'createdBy')
 * @returns {Function} - Express middleware fonksiyonu
 */
const isResourceOwner = (userIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            const { user } = req.user;
            const resourceUserId = req.body[userIdField] || req.params[userIdField];

            // Admin her şeyi yapabilir
            if (user.role === 'sysadmin') {
                return next();
            }

            // Kullanıcı kendi kaynağı üzerinde işlem yapıyor mu kontrol et
            if (resourceUserId && resourceUserId.toString() === user.id) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Yetkisiz erişim',
                error: 'Bu kaynak üzerinde işlem yapma yetkiniz bulunmamaktadır'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Kaynak sahibi kontrolü sırasında bir hata oluştu',
                error: error.message
            });
        }
    };
};

export {
    roleCheck,
    isClassTeacherOrOwner,
    isClassMember,
    isResourceOwner
};