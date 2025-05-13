import fs from "fs";
import {Attachment} from "../database/models/attachmentModel.js";

//Cache Modules
import *as attachmentCacheModule from "../cache/modules/attachmentModule.js";

//Database Modules
import *as attachmentDatabaseModule from "../database/modules/attachmentModule.js";

export const processMedia = async (req) => {
    try {
        const unprocessedFiles = req.files

        if (!Array.isArray(unprocessedFiles) || unprocessedFiles.length === 0) {
            return [];
        }
        const classId = req?.body?.classId || req?.params?.classId || null;
        const userId = req?.user?.id;
        const permission = req.body.permission || 0

        let files = unprocessedFiles.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path,
            size: file.size,
            classId,
            userId,
            uploadDate: Date.now(),
            permission
        }));

        let fileIds = [];
        for (const file of files) {
            const newAttach = await attachmentDatabaseModule.createAttachment(file);
            fileIds.push(newAttach._id);
        }

        return fileIds;
    } catch (error) {
        console.error("Error processing media:", error);
        return error;
    }
};

export const deleteAttachment = async (attachmentId) => {
    try {
        if (!attachmentId) return;
        //Cacheden attachment bilgisini al
        const attachment = await attachmentCacheModule.getCachedAttachmentData(attachmentId, attachmentDatabaseModule.getAttachmentById)
        //Resimi Sil
        fs.unlinkSync(attachment.path)
        // Veritabanından kaldır
        await Attachment.findByIdAndDelete(attachmentId);
    } catch (error) {
        return error
    }
}