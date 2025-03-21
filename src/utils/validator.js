import ApiResponse from "../utils/ApiResponse.js";
import {body, param, validationResult} from "express-validator";

const validate = (req, res, next) => {
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

const userCreateValidationRules = [
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

const classCreateValidationRules = [
    body('title')
        .notEmpty().withMessage('Sınıf ismi boş olamaz.')
        .isString().withMessage('Sınıf ismi bir metin olmalıdır')
        .isLength({ min: 2, max: 32 }).withMessage('İsim 2-32 karakter arasında olmalıdır')
]

/**
 * MongoDB ID formatını doğrulama
 */
const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId().withMessage('Geçerli bir ID formatı değil')
];

export default {
    validate,
    validateMongoId,
    userCreateValidationRules,
    classCreateValidationRules
}