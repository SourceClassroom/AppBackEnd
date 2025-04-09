import { Attachment } from "../models/attachmentModel.js";

export const getAttachmentById = async (attachmentId) => {
    try {
        return await Attachment.findById(attachmentId)
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const createAttachment = async (data) => {
    try {
        const { filename, originalname, mimetype, path, classId, userId, size, permission } = data
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
        throw error
    }
}
