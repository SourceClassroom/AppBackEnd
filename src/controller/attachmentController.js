import fs from 'fs'
import path from 'path'
import ApiResponse from "../utils/apiResponse.js";
import { streamFile } from "../utils/fileHelper.js";
import { RateLimiterMemory } from 'rate-limiter-flexible';

//Cache repositories
import *as userCacheHandler from '../cache/handlers/userCacheHandler.js';
import *as attachmentCacheHandler from '../cache/handlers/attachmentCacheHandler.js';

//Database Models
import *as userDatabaseRepository from '../database/repositories/userRepository.js';
import *as attachmentDatabaseRepository from '../database/repositories/attachmentRepository.js';

const studentRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
    blockDuration: 60 * 2
});

export const downloadAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;

        if (req.user.role === 'student') {
            try {
                await studentRateLimiter.consume(req.user.id);
            } catch (rateLimitError) {
                return res.status(429).json(
                    ApiResponse.rateLimit('İndirme limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.')
                );
            }
        }

        const file = await attachmentCacheHandler.getCachedAttachmentData(attachmentId, attachmentDatabaseRepository.getAttachmentById)

        if (!file) {
            res.sendStatus(404).json(ApiResponse.json('Dosya bulunamadı.'))
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json(ApiResponse.json('Dosya sistemde bulunamadı.'));
        }
        const normalizedPath = path.normalize(file.path).replace(/^(\.\.(\/|\\|$))+/, '');
        if (normalizedPath !== file.path) {
            return res.status(400).json(ApiResponse.error("Invalid file path"));
        }

        res.download(normalizedPath, file.originalname)
    } catch (error) {
        console.log(error);
        res.status(500).json(
            ApiResponse.serverError('Dosya indirilirken bir hata meydana geldi.', error)
        );
    }
}

export const viewAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;

        const file = await attachmentCacheHandler.getCachedAttachmentData(attachmentId, attachmentDatabaseRepository.getAttachmentById)
        if (!file) {
            return res.status(404).json(ApiResponse.notFound("Dosya bulunamadı."));
        }

        // Validate file path to prevent path traversal
        const normalizedPath = path.normalize(file.path).replace(/^(\.\.(\/|\\|$))+/, '');
        if (normalizedPath !== file.path) {
            return res.status(400).json(ApiResponse.error("Invalid file path"));
        }
        return streamFile(res, normalizedPath, file.mimetype);
    } catch (error) {
        console.log(error);
        res.status(500).json(ApiResponse.serverError("Dosya görüntülenirken bir hata meydana geldi.", error));
    }
};

export const viewUserAvatar = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById);

        if (!user || !user.profile?.avatar) {
            return res.status(404).json(ApiResponse.notFound("Avatar bulunamadı."));
        }

        const attachmentData = await attachmentCacheHandler.getCachedAttachmentData(user.profile.avatar, attachmentDatabaseRepository.getAttachmentById)

        // Validate attachment path
        const normalizedPath = path.normalize(attachmentData.path).replace(/^(\.\.(\/|\\|$))+/, '');
        if (normalizedPath !== attachmentData.path) {
            return res.status(400).json(ApiResponse.error("Invalid file path"));
        }

        return streamFile(res, normalizedPath, attachmentData.mimetype);
    } catch (error) {
        console.log(error);
        res.status(500).json(ApiResponse.serverError("Avatar görüntülenirken bir hata meydana geldi.", error));
    }
}

export const uploadAttachment = async (req, res) => {
    try {
        const fileIds = await processMedia(req)

        return res.status(200).json(ApiResponse.success("Yükleme başarılı", {fileIds}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
}