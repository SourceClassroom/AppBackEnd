import {Attachment} from "../database/models/attachmentModel.js";

export const processMedia = async (req) => {
    try {
        const unprocessedFiles = req.files

        if (!Array.isArray(unprocessedFiles) || unprocessedFiles.length === 0) {
            return [];
        }
        const classId = req?.body?.classId || req?.params?.classId || null;
        const userId = req?.user?.id;

        let files = unprocessedFiles.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path,
            size: file.size,
            classId,
            userId,
            uploadDate: Date.now(),
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
        const {filename,originalname,mimetype,path,classId,userId,size} = data
        const attachment = new Attachment({
            filename,
            originalname,
            mimetype,
            path,
            classroom: classId,
            userId,
            size
        });

        return await attachment.save();
    } catch (error) {
        console.log(error);
        return error
    }
}
