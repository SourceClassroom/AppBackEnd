import {Attachment} from "../database/models/attachmentModel.js";

const createAttachmentOnDB = async (data) => {
    try {
        const {filename,originalname,mimetype,path,classId,userId,size} = data
        const attachment = new Attachment({
            filename,
            originalname,
            mimetype,
            path,
            classId,
            userId,
            size
        });

        return await attachment.save();
    } catch (error) {
        console.log(error);
        return error
    }
}

export {
    createAttachmentOnDB
}