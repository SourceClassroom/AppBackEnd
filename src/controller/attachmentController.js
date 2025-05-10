import fs from 'fs'
import path from 'path'
import ApiResponse from "../utils/apiResponse.js";
import { streamFile } from "../utils/fileHelper.js";
import { RateLimiterMemory } from 'rate-limiter-flexible';

//Cache modules
import *as userCacheModule from '../cache/modules/userModule.js';
import *as attachmentCacheModule from '../cache/modules/attachmentModule.js';

//Database Models
import *as userDatabaseModule from '../database/modules/userModule.js';
import *as attachmentDatabaseModule from '../database/modules/attachmentModule.js';

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

        const file = await attachmentCacheModule.getCachedAttachmentData(attachmentId, attachmentDatabaseModule.getAttachmentById)

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

        const file = await attachmentCacheModule.getCachedAttachmentData(attachmentId, attachmentDatabaseModule.getAttachmentById)
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

        const user = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById);

        if (!user || !user.profile?.avatar) {
            return res.status(404).json(ApiResponse.notFound("Avatar bulunamadı."));
        }

        const attachmentData = await attachmentCacheModule.getCachedAttachmentData(user.profile.avatar, attachmentDatabaseModule.getAttachmentById)

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