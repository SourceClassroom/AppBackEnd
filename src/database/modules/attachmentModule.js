import { Attachment } from "../models/attachmentModel.js";

export const getAttachmentById = async (attachmentId) => {
    try {
        return await Attachment.findById(attachmentId)
    } catch (error) {
        console.log(error)
        return error
    }
}