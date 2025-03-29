import fs from 'fs';
import path from 'path';
import ApiResponse from "../utils/apiResponse.js";
import { streamFile } from "../utils/fileHelper.js";
import {Attachment} from "../database/models/attachmentModel.js"
import *as cacheService from "../services/cacheService.js"

export const downloadAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const file = await Attachment.findById(attachmentId);

        if (!file) {
            res.sendStatus(404).json(ApiResponse.json('Dosya bulunamadı.'))
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json(ApiResponse.json('Dosya sistemde bulunamadı.'));
        }

        res.download(file.path, file.originalname)
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Dosya indirilirken bir hata meydana geldi.', error)
        );
    }
}

export const viewAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const file = await Attachment.findById(attachmentId);

        if (!file) {
            return res.status(404).json(ApiResponse.notFound("Dosya bulunamadı."));
        }

        return streamFile(res, file.path, file.mimetype);
    } catch (error) {
        console.log(error);
        res.status(500).json(ApiResponse.serverError("Dosya görüntülenirken bir hata meydana geldi.", error));
    }
};

export const viewUserAvatar = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await cacheService.getUserFromCacheOrCheckDb(userId)

        if (!user || !user.profile.avatar) {
            return res.status(404).json(ApiResponse.notFound("Avatar bulunamadı."));
        }
        const attachmentData = await cacheService.getAttachmentFromCacheOrCheckDb(user.profile.avatar)

        return streamFile(res, attachmentData.path, attachmentData.mimetype);
    } catch (error) {
        console.log(error);
        res.status(500).json(ApiResponse.serverError("Avatar görüntülenirken bir hata meydana geldi.", error));
    }
}