import {body, param, validationResult} from "express-validator";

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Doğrulama hatası',
            errors: errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg;
                return acc;
            }, {}),
            statusCode: 400,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

export const newPasswordValidator = [
    body('newPassword')
        .notEmpty().withMessage('Şifre alanı zorunludur')
        .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir')
]

export const newEmailValidator = [
    body('email')
        .notEmpty().withMessage('E-posta alanı zorunludur')
        .isEmail().withMessage('Geçerli bir e-posta adresi girilmelidir')
        .normalizeEmail({gmail_remove_dots: false})
]

export const validateNotificationPreferences = [
    body('notificationPreferences').isObject().withMessage('notificationPreferences must be an object'),
    body('notificationPreferences.new_assignment')
        .optional().isBoolean().withMessage('new_assignment must be a boolean'),
    body('notificationPreferences.assignment_graded')
        .optional().isBoolean().withMessage('assignment_graded must be a boolean'),
    body('notificationPreferences.new_announcement')
        .optional().isBoolean().withMessage('new_announcement must be a boolean'),
    body('notificationPreferences.new_material')
        .optional().isBoolean().withMessage('new_material must be a boolean'),
    body('notificationPreferences.new_comment')
        .optional().isBoolean().withMessage('new_comment must be a boolean'),
    body('notificationPreferences.assignment_due_reminder')
        .optional().isBoolean().withMessage('assignment_due_reminder must be a boolean'),
    body('notificationPreferences.submission_reminder')
        .optional().isBoolean().withMessage('submission_reminder must be a boolean'),
    body('notificationPreferences.email_notifications')
        .optional().isBoolean().withMessage('email_notifications must be a boolean'),
];

export const userCreateValidationRules = [
    body('name')
        .notEmpty().withMessage('İsim alanı zorunludur')
        .isString().withMessage('İsim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('İsim 2-32 karakter arasında olmalıdır')
        .matches(/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9 ]+$/).withMessage('İsim sadece alfanümerik karakterler içerebilir')
        .toLowerCase(),
    body('surname')
        .notEmpty().withMessage('Soyisim alanı zorunludur')
        .isString().withMessage('Soyisim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('Soyisim 2-32 karakter arasında olmalıdır')
        .matches(/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9 ]+$/).withMessage('Soyisim sadece alfanümerik karakterler içerebilir')
        .toLowerCase(),
    body('email')
        .notEmpty().withMessage('E-posta alanı zorunludur')
        .isEmail().withMessage('Geçerli bir e-posta adresi girilmelidir')
        .normalizeEmail({gmail_remove_dots: false}),
    body('password')
        .notEmpty().withMessage('Şifre alanı zorunludur')
        .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
    body('role')
        .optional()
        .isIn(['student', 'teacher', 'sysadmin']).withMessage('Geçersiz rol. Rol student, teacher veya sysadmin olmalıdır')
];

export const validateProfileUpdate = [
    body('name')
        .notEmpty().withMessage('İsim alanı zorunludur')
        .isString().withMessage('İsim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('İsim 2-32 karakter arasında olmalıdır')
        .matches(/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9 ]+$/).withMessage('İsim sadece alfanümerik karakterler içerebilir')
        .toLowerCase(),
    body('surname')
        .notEmpty().withMessage('Soyisim alanı zorunludur')
        .isString().withMessage('Soyisim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('Soyisim 2-32 karakter arasında olmalıdır')
        .matches(/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9 ]+$/).withMessage('Soyisim sadece alfanümerik karakterler içerebilir')
        .toLowerCase(),
    body('profile.bio')
        .optional()
        .isString().withMessage('Bio must be a string')
        .isLength({ max: 1024 }).withMessage('Bio cannot exceed 1024 characters'),
    body('profile.institutionId')
        .optional()
]

export const validateWeek = [
    body('title')
        .notEmpty().withMessage('Başlık alanı zorunludur.')
        .isLength({ min: 3 }).withMessage('Başlık en az 3 karakter olmalıdır.'),
    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir.'),
    body('startDate')
        .notEmpty().withMessage('Başlangıç tarihi zorunludur.')
        .isISO8601().withMessage('Geçerli bir başlangıç tarihi giriniz.'),
    body('endDate')
        .notEmpty().withMessage('Bitiş tarihi zorunludur.')
        .isISO8601().withMessage('Geçerli bir bitiş tarihi giriniz.')
        .custom((value, { req }) => {
            const start = new Date(req.body.startDate);
            const end = new Date(value);
            if (start >= end) {
                throw new Error('Başlangıç tarihi, bitiş tarihinden önce olmalıdır.');
            }
            return true;
        }),
];

export const validateCreateAssignment = [
    body('classId')
        .notEmpty().withMessage('Sınıf ID alanı boş bırakılamaz.')
        .isMongoId().withMessage('Geçerli bir sınıf ID giriniz.'),
    body('title')
        .notEmpty().withMessage('Başlık alanı zorunludur.')
        .isLength({ min: 3 }).withMessage('Başlık en az 3 karakter olmalıdır.'),
    body('description')
        .optional()
        .isLength({ max: 2048 }).withMessage('Açıklama en fazla 2048 karakter olabilir.'),
    body('dueDate')
        .notEmpty().withMessage('Son teslim tarihi zorunludur.'),
    body('week')
        .optional()
        .isMongoId().withMessage('Geçerli bir hafta ID giriniz.'),
]

export const validateCreateMaterial = [
    body('classId')
        .notEmpty().withMessage('Sınıf ID alanı boş bırakılamaz.')
        .isMongoId().withMessage('Geçerli bir sınıf ID giriniz.'),
    body('title')
        .notEmpty().withMessage('Başlık alanı zorunludur.')
        .isLength({ min: 3 }).withMessage('Başlık en az 3 karakter olmalıdır.'),
    body('description')
        .optional()
        .isLength({ max: 2048 }).withMessage('Açıklama en fazla 2048 karakter olabilir.'),
    body('week')
        .optional()
        .isMongoId().withMessage('Geçerli bir hafta ID giriniz.'),
]

export const validateUpdateMaterial = [
    body('title')
        .notEmpty().withMessage('Başlık alanı zorunludur.')
        .isLength({ min: 3 }).withMessage('Başlık en az 3 karakter olmalıdır.'),
    body('description')
        .optional()
        .isLength({ max: 2048 }).withMessage('Açıklama en fazla 2048 karakter olabilir.'),
    body('week')
        .optional()
        .isMongoId().withMessage('Geçerli bir hafta ID giriniz.'),
]

export const validateMailVerification = [
    body('mail')
        .notEmpty().withMessage('E-posta alanı zorunludur')
        .isEmail().withMessage('Geçerli bir e-posta adresi girilmelidir')
        .normalizeEmail({gmail_remove_dots: false}),
    body('code')
        .customSanitizer(value => value.toUpperCase())
        .isLength({ min: 6, max: 6 }).withMessage('Sınıf kodu 6 karakter olmalıdır.')
        .matches(/^[A-Z0-9]{6}$/).withMessage('Sınıf kodu sadece büyük harf ve rakamlardan oluşabilir.'),
]

export const classValidate = [
    body('title')
        .notEmpty().withMessage('Sınıf ismi boş olamaz.')
        .isString().withMessage('Sınıf ismi bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('İsim 2-32 karakter arasında olmalıdır'),
    body('description')
        .optional()
        .isString().withMessage('Açıklama bir metin olmalıdır')
        .isLength({ max: 1024 }).withMessage('Açıklama en fazla 1024 karakter olabilir.')
]

export const validateClassCode = (paramName = 'classCode') => [
    param(paramName)
        .customSanitizer(value => value.toUpperCase())
        .isLength({ min: 6, max: 6 }).withMessage('Sınıf kodu 6 karakter olmalıdır.')
        .matches(/^[A-Z0-9]{6}$/).withMessage('Sınıf kodu sadece büyük harf ve rakamlardan oluşabilir.')
]

export const validateSubmission = [
    body('assignmentId')
        .notEmpty().withMessage("Ödev ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir ödev ID giriniz."),
    body('description')
        .optional()
        .isLength({ max: 1024 }).withMessage('Açıklama en fazla 1024 karakter olabilir.'),
]

export const validateGrade = [
    body("submissionId")
        .notEmpty().withMessage("Gönderim ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir gönderim ID giriniz."),
    body("classId")
        .notEmpty().withMessage('Sınıf ID alanı boş bırakılamaz.')
        .isMongoId().withMessage('Geçerli bir sınıf ID giriniz.'),
    body("grade")
        .notEmpty().withMessage("Not alanı boş olamaz")
        .isFloat({ min: 0, max: 100 }).withMessage("Not değeri 0 ile 100 arasında olmalıdır."),
    body("feedback")
        .notEmpty().withMessage("Feedback analı boş olamaz.")
        .isLength({ max: 500 }).withMessage('Feedback en fazla 500 karakter olabilir.'),
]

export const validateCreatePost = [
    body("classId")
        .notEmpty().withMessage("Sınıf ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir sınıf ID giriniz."),
    body("content")
        .notEmpty().withMessage("Duyuru içeriği boş olamaz.")
        .isLength({max: 2048}).withMessage("Duyuru içeriği 2048 karakterden fazla olamaz."),
    body("week")
        .optional()
        .isMongoId().withMessage("Geçerli bir hafta ID giriniz.")
]

export const validateComment = [
    body("classId")
        .notEmpty().withMessage("Sınıf ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir sınıf ID giriniz."),
    body("postId")
        .notEmpty().withMessage("Post ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir post ID giriniz."),
    body("content")
        .notEmpty().withMessage("Yorum içeriği boş olamaz.")
        .isLength({max: 250}).withMessage("Yorum içeriği 250 karakterden fazla olamaz.")
]

export const validateLesson = [
    body("topic")
        .notEmpty().withMessage("Ders konusu boş olamaz.")
        .isLength({min: 3}).withMessage("Ders konusu en az 3 karakter olmalıdır."),
    body("description")
        .optional()
        .isLength({max: 1025}).withMessage("Ders açıklaması 1024 karakterden fazla olamaz."),
    body("start_time")
        .notEmpty().withMessage("Ders başlangıç zamanı boş olamaz.")
        .isISO8601().withMessage("Geçerli bir başlangıç zamanı giriniz."),
    body("duration")
        .optional()
        .isInt({min: 1}).withMessage("Ders süresi en az 1 dakika olmalıdır."),
    body("classId")
        .notEmpty().withMessage("Sınıf ID alanı boş olamaz.")
        .isMongoId().withMessage("Geçerli bir sınıf ID giriniz."),
    body("week")
        .optional()
        .isMongoId().withMessage("Geçerli bir hafta ID giriniz."),
    body("joinUrl")
        .optional()
        .isURL().withMessage("Geçerli bir URL giriniz.")
]

export const validateLessonStatus = [
    body("classId")
        .notEmpty().withMessage("Sınıf ID alanı boş olamaz.")
        .isMongoId().withMessage("Geçerli bir sınıf ID giriniz."),
    body("week")
        .optional()
        .isMongoId().withMessage("Geçerli bir hafta ID giriniz."),
    body("status")
        .notEmpty().withMessage("Ders durumu boş olamaz.")
        .isIn(['pending', 'started', 'ended']).withMessage("Geçerli bir ders durumu giriniz.")
]

export const validateUserStatus = [
    body("userId")
        .notEmpty().withMessage("Kullanıcı ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir kullanıcı ID giriniz."),
    body("status")
        .notEmpty().withMessage("Kullanıcı durumu boş olamaz.")
        .isIn(['active', 'inactive', 'suspended', 'pending', 'mailVerification']).withMessage("Geçerli bir kullanıcı durumu giriniz.")
]

export const validateUpdateUserForAdmin = [
    body("userId")
        .notEmpty().withMessage("Kullanıcı ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir kullanıcı ID giriniz."),
    body("data")
        .notEmpty().withMessage("Güncellenecek veri boş olamaz.")
        .isObject().withMessage("Güncellenecek veri bir nesne olmalıdır."),
    body("data.name")
        .notEmpty().withMessage("İsim verisi boş olamaz.")
        .isString().withMessage("İsim bir metin olmalıdır.")
        .isLength({min: 2, max: 32}).withMessage("İsim 2-32 karakter arasında olmalıdır.")
        .matches(/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9 ]+$/).withMessage("İsim sadece alfanümerik karakterler içerebilir.")
        .toLowerCase(),
    body("data.surname")
        .notEmpty().withMessage("Soyisim verisi boş olamaz.")
        .isString().withMessage("Soyisim bir metin olmalıdır.")
        .isLength({min: 2, max: 32}).withMessage("Soyisim 2-32 karakter arasında olmalıdır.")
        .matches(/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9 ]+$/).withMessage("Soyisim sadece alfanümerik karakterler içerebilir.")
        .toLowerCase(),
    body("data.email")
        .notEmpty().withMessage("Email verisi boş olamaz.")
        .isEmail().withMessage("Geçerli bir e-posta adresi giriniz.")
        .normalizeEmail({gmail_remove_dots: false}),
    body("data.role")
        .notEmpty().withMessage("Rol verisi boş olamaz.")
        .isIn(['student', 'teacher', 'sysadmin']).withMessage("Geçerli bir kullanıcı rolü giriniz."),
    body("data.accountStatus")
        .notEmpty().withMessage("Durum verisi boş olamaz.")
        .isIn(['active', 'inactive', 'suspended', 'pending', 'mailVerification']).withMessage("Geçerli bir kullanıcı durumu giriniz.")
]

export const validateEvent = [
    body("classId")
        .optional()
        .isMongoId().withMessage("Geçerli bir sınıf ID giriniz."),
    body("userId")
        .optional()
        .isMongoId().withMessage("Geçerli bir kullanıcı ID giriniz."),
    body("title")
        .notEmpty().withMessage("Başlık boş olamaz.")
        .isString().withMessage("Başlık bir metin olmalıdır.")
        .isLength({min: 3, max: 32}).withMessage("Başlık 3-32 karakter arasında olmalıdır."),
    body("description")
        .optional()
        .isString().withMessage("Açıklama bir metin olmalıdır.")
        .isLength({max: 512}).withMessage("Açıklama 512 karakterden fazla olamaz."),
    body("date")
        .notEmpty().withMessage("Tarih boş olamaz.")
        .isISO8601().withMessage("Geçerli bir tarih giriniz."),
    body("type")
        .notEmpty().withMessage("Tip boş olamaz.")
        .isIn(['lesson', 'assignment_due', 'exam', 'other']).withMessage("Geçerli bir olay tipi giriniz."),
    body("visibility")
        .notEmpty().withMessage("Görünürlük boş olamaz.")
        .isIn(['class', 'user']).withMessage("Geçerli bir görünürlük giriniz."),
    body("metadata.tags")
            .optional()
            .isArray().withMessage("Etiketler bir dizi olmalıdır.")
            .custom((tags) => {
                if (tags && Array.isArray(tags)) {
                    for (const tag of tags) {
                        if (typeof tag !== 'string' || tag.length < 1 || tag.length > 6) {
                            throw new Error('Her etiket 1-6 karakter arasında olmalıdır');
                        }
                    }
                }
                return true;
            }),
    body("metadata.color")
        .optional()
        .isHexColor().withMessage("Geçerli bir renk kodu giriniz.")
]

export const validateCreateConversation = [
    body('participants')
        .isArray().withMessage('Katılımcılar bir dizi olmalıdır')
        .notEmpty().withMessage('En az bir katılımcı gereklidir')
        .custom(participants => {
            if (!participants.every(p => /^[0-9a-fA-F]{24}$/.test(p))) {
                throw new Error('Tüm katılımcılar geçerli MongoDB ID olmalıdır');
            }
            return true;
        }),
    body('isGroup')
        .isBoolean().withMessage('isGroup bir boolean değer olmalıdır')
        .default(false),
    body('groupName')
        .optional({ nullable: true })
        .custom((value, { req }) => {
            if (req.body.isGroup && !value) {
                throw new Error('Grup sohbetleri için grup adı zorunludur');
            }
            return true;
        })
        .isString().withMessage('Grup adı bir metin olmalıdır')
        .trim().isLength({ min: 1, max: 16 }).withMessage('Grup adı 1-16 karakter arasında olmalıdır'),
]

/**
 * MongoDB ID formatını doğrulama
 */
export const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId().withMessage('Geçerli bir ID formatı değil')
];