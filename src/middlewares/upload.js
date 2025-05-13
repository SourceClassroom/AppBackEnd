import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import ApiResponse from "../utils/apiResponse.js";
import {allAllowedFileTypes} from "../utils/fileTypes.js"

//Database Modules
import *as  assignmentDatabaseModule from "../database/modules/assignmentModule.js";

// __dirname'in ESM karşılığını elde etme
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dosya yükleme dizinini oluştur
const createUploadDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const uploadTypes = [
    "assignment", "submission", "avatar",
    "chat", "material", "general", "post"
]

// Önce memory storage kullan - kontrol için
const memoryStorage = multer.memoryStorage();

// Memory'de dosyaları tutan multer örneği

const memoryUpload = (options = {}) => {
    const {
        fileSize = 1024 * 1024 * 1024, // Default 1GB
        allowedTypes = allAllowedFileTypes // Default tüm izin verilen tipler
    } = options;

    return multer({
        storage: memoryStorage,
        limits: {
            fileSize: fileSize,
        },
        fileFilter: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (allowedTypes.includes(ext)) {
                return cb(null, true);
            }
            cb(new Error(`Bu dosya türü desteklenmiyor! İzin verilen dosya türleri: ${allowedTypes.join(', ')}`), false);
        }
    });
};

// İki aşamalı upload fonksiyonu
export const validateAndUpload = (options = {}) => {
    let {
        fieldName = "files",
        minFiles = 1,
        maxFiles = 10,
        fileSize = 1024 * 1024 * 1024, // Default 1GB
        allowedTypes = allAllowedFileTypes
    } = options;

    return [
        // 1. Aşama: Memory'ye al ve kontrol et
        async (req, res, next) => {
            const uploadMiddleware = memoryUpload({
                fileSize,
                allowedTypes
            }).array(fieldName, maxFiles);

            uploadMiddleware(req, res, (err) => {
                if (err) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json(ApiResponse.error(`Dosya boyutu çok büyük. Maksimum ${(fileSize / (1024 * 1024)).toFixed(2)} MB yükleyebilirsiniz.`, err, 400));
                    }
                    return res.status(400).json(ApiResponse.error(err.message || `Bir hata meydana geldi.`, err, 400));
                }

                // Dosya gönderilmemişse ve minFiles 0 ise sorun değil, geç
                if (!req.files || req.files.length === 0) {
                    if (minFiles === 0) return next();
                    return res.status(400).json(ApiResponse.error(`En az ${minFiles} dosya yüklemelisiniz.`, null, 400));
                }

                if (req.files.length < minFiles) {
                    return res.status(400).json(ApiResponse.error(`En az ${minFiles} dosya yüklemelisiniz.`, null, 400));
                }

                if (req.files.length > maxFiles) {
                    return res.status(400).json(ApiResponse.error(`Maksimum dosya sayısı (${maxFiles}) aşıldı.`, null, 400));
                }

                next();
            });
        },
        // 2. Aşama: Diske yaz
        (req, res, next) => {
            if (!uploadTypes.includes(req.body.uploadType)) return res.status(400).json(ApiResponse.error("Desteklenmeyen yükleme tipi."))
            if (!req.files || req.files.length === 0) return next();
            try {
                const userId = req.user?.id || 'anonymous';
                const uploadType = req.body?.uploadType || 'general';
                const referenceId = req.body?.classId || 'general';
                const uploadPath = path.join(
                    __dirname,
                    '../..',
                    'public',
                    'uploads',
                    String(uploadType),
                    String(referenceId),
                    String(userId)
                );
                createUploadDir(uploadPath);

                // Memory'deki tüm dosyaları diske yaz
                // Sanitize filename by removing any path traversal characters
                req.files.forEach((file, index) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const fileExt = path.extname(file.originalname).toLowerCase();
                    // Only allow alphanumeric chars, dash and underscore in filename
                    const sanitizedFieldname = file.fieldname.replace(/[^a-zA-Z0-9-_]/g, '');
                    const filename = sanitizedFieldname + '-' + uniqueSuffix + fileExt;
                    // Ensure path does not contain traversal
                    const safePath = path.normalize(path.join(uploadPath, filename))
                        .replace(/^(\.\.[\/\\])+/, '');
                    if (!safePath.startsWith(uploadPath)) {
                        throw new Error('Invalid file path detected');
                    }
                    fs.writeFileSync(safePath, file.buffer);
                    req.files[index].destination = uploadPath;
                    req.files[index].path = safePath;
                    req.files[index].filename = filename;
                });

                next();
            } catch (error) {
                return res.status(500).json({
                    errors: [{
                        msg: 'Dosya kaydedilirken bir hata oluştu: ' + error.message,
                        param: fieldName
                    }]
                });
            }
        }
    ];
}
// Orijinal multer yapılandırması (direkt kullanım için)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?.id || 'anonymous';
        const uploadType = req.body?.uploadType || 'general';
        const referenceId = req.body?.referenceId || 'general';

        const uploadPath = path.join(
            __dirname,
            '../..',
            'public',
            'uploads',
            String(uploadType),
            String(referenceId),
            String(userId)
        );

        createUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});

const diskUpload = multer({
    storage: diskStorage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedFileTypes.includes(ext)) {
            return cb(null, true);
        }

        cb(new Error('Bu dosya türü desteklenmiyor! Lütfen geçerli bir dosya yükleyin.'), false);
    },
    limits: {
        fileSize: 1024 * 1024 * 1024
    }
});

// Standart multer fonksiyonlarını sarmalayan yapı
const handleDiskUpload = (method, fieldName, options) => {
    return (req, res, next) => {
        const uploadMiddleware = diskUpload[method](fieldName, options);

        uploadMiddleware(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    errors: [{
                        msg: err.message,
                        param: fieldName
                    }]
                });
            }
            next();
        });
    };
};

// Klasik upload metotları
const upload = {
    single: (fieldName) => handleDiskUpload('single', fieldName),
    array: (fieldName, maxCount) => handleDiskUpload('array', fieldName, maxCount),
    fields: (fields) => handleDiskUpload('fields', fields),
    none: () => handleDiskUpload('none'),
    // Yeni iki aşamalı yükleme metodu
    validateAndUpload
};

export default upload;