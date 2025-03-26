import ApiResponse from "../utils/apiResponse.js";
import {Attachment} from "../database/models/attachmentModel.js"

export const downloadAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const file = await Attachment.findById(attachmentId);
        if (!file) {
            res.sendStatus(404).json(ApiResponse.json('Dosya bulunamadı.'))
        }

        res.download(file.path, file.originalname)
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Dosya indirilirken bir hata meydana geldi.', error)
        );
    }
}