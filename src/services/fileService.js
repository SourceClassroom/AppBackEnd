import fs from "fs";
import {getFromCache} from "./cacheService.js";
import {Attachment} from "../database/models/attachmentModel.js";


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
            const newAttach = await createAttachmentOnDB(file);
            fileIds.push(newAttach._id);
        }

        return fileIds;
    } catch (error) {
        console.error("Error processing media:", error);
        return error;
    }
};


export const createAttachmentOnDB = async (data) => {
    try {
        const {filename,originalname,mimetype,path,classId,userId,size,permission} = data
        const attachment = new Attachment({
            filename,
            originalname,
            mimetype,
            path,
            classroom: classId,
            userId,
            size,
            permission
        });

        return await attachment.save();
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteAttachment = async (attachmentId) => {
    try {
        if (!attachmentId) return;
        let attachment;
        const cacheKey = `attachment:${attachmentId}`
        //Cacheden attachment bilgisini al
        const getAttachmentDataFromCache = await getFromCache(cacheKey)
        //Alinan veriyi degiskene ata
        if (getAttachmentDataFromCache) attachment = getAttachmentDataFromCache
        // Veritabanından attachment bilgisini al
        else attachment = await Attachment.findById(attachmentId);
        if (!attachment) {
          //console.log("Attachment bulunamadı.");
          return;
        }
        //Resimi Sil
        fs.unlinkSync(attachment.path)
        // Veritabanından kaldır
        await Attachment.findByIdAndDelete(attachmentId);
    } catch (error) {
        return error
    }
}