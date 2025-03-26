import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";
import {Submission} from "../database/models/submissionsModel.js"

export const getSubmission = async (req, res) => {

}

export const createSubmission = async (req, res) => {
    try {
        const {assignmentId, description} = req.body;

        const fileIds = await processMedia(req);

        const newSubmissionData = {
            assignment: assignmentId,
            student: req.user.id,
            description,
            attachments: fileIds
        }
        const newSubmission = await Submission.create(newSubmissionData)
        return res.status(201).json(ApiResponse.success("Gönderim başarıyla eklendi.", newSubmission, 201));
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Giriş yapılırken bir hata oluştu', error)
        );
    }
}