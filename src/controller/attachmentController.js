import fs from 'fs';
import path from 'path';
import ApiResponse from "../utils/apiResponse.js";
import {Attachment} from "../database/models/attachmentModel.js"

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
            return res.status(404).json(ApiResponse.notFound('Dosya bulunamadı.'));
        }

        // Check if file exists on the filesystem
        if (!fs.existsSync(file.path)) {
            return res.status(404).json(ApiResponse.notFound('Dosya sistemde bulunamadı.'));
        }

        // Set the correct content type
        res.contentType(file.mimetype);

        // Stream the file
        const fileStream = fs.createReadStream(file.path);

        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            res.status(500).json(
                ApiResponse.serverError('Dosya görüntülenirken bir hata meydana geldi.', err)
            );
        });
    } catch (error) {
        console.log(error)
        res.status(500).json(
            ApiResponse.serverError('Dosya görüntülenirken bir hata meydana geldi.', error)
        );
    }
};