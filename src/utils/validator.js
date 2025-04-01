import ApiResponse from "../utils/ApiResponse.js";
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

export const userCreateValidationRules = [
    body('name')
        .notEmpty().withMessage('İsim alanı zorunludur')
        .isString().withMessage('İsim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('İsim 2-32 karakter arasında olmalıdır')
        .isAlphanumeric('tr-TR').withMessage('İsim sadece alfanümerik karakterler içerebilir'),
    body('surname')
        .notEmpty().withMessage('Soyisim alanı zorunludur')
        .isString().withMessage('Soyisim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('Soyisim 2-32 karakter arasında olmalıdır')
        .isAlphanumeric('tr-TR').withMessage('Soyisim sadece alfanümerik karakterler içerebilir'),
    body('email')
        .notEmpty().withMessage('E-posta alanı zorunludur')
        .isEmail().withMessage('Geçerli bir e-posta adresi girilmelidir')
        .normalizeEmail(),
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
        .isAlphanumeric('tr-TR').withMessage('İsim sadece alfanümerik karakterler içerebilir'),
    body('surname')
        .notEmpty().withMessage('Soyisim alanı zorunludur')
        .isString().withMessage('Soyisim bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('Soyisim 2-32 karakter arasında olmalıdır')
        .isAlphanumeric('tr-TR').withMessage('Soyisim sadece alfanümerik karakterler içerebilir'),
    body('profile.bio')
        .optional()
        .isString().withMessage('Bio must be a string')
        .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('profile.institutionId')
        .optional()
]

export const validateCreateWeek = [
    body('classId')
        .notEmpty().withMessage('Sınıf ID alanı boş bırakılamaz.')
        .isMongoId().withMessage('Geçerli bir sınıf ID giriniz.'),
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
        .isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir.'),
    body('dueDate')
        .notEmpty().withMessage('Son teslim tarihi zorunludur.'),
    body('week')
        .optional()
        .isMongoId().withMessage('Geçerli bir hafta ID giriniz.'),
]

export const classCreateValidationRules = [
    body('title')
        .notEmpty().withMessage('Sınıf ismi boş olamaz.')
        .isString().withMessage('Sınıf ismi bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('İsim 2-32 karakter arasında olmalıdır')
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
        .isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir.'),
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
        .isNumeric({ min: 0, max: 100 }).withMessage("Not değeri 0 ile 100 arasında olmalıdır.")
]
export const validateFeedback = [
    body("submissionId")
        .notEmpty().withMessage("Gönderim ID alanı zorunludur.")
        .isMongoId().withMessage("Geçerli bir gönderim ID giriniz."),
    body("classId")
        .notEmpty().withMessage('Sınıf ID alanı boş bırakılamaz.')
        .isMongoId().withMessage('Geçerli bir sınıf ID giriniz.'),
    body("feedback")
        .notEmpty().withMessage("Feedback analı boş olamaz.")
        .isLength({ max: 500 }).withMessage('Feedback en fazla 500 karakter olabilir.'),
]



/**
 * MongoDB ID formatını doğrulama
 */
export const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId().withMessage('Geçerli bir ID formatı değil')
];