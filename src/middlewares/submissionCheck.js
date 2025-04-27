import ApiResponse from "../utils/apiResponse.js";
import {Submission} from "../database/models/submissionsModel.js";
import {Assignment} from "../database/models/assignmentModel.js";

//TODO remove direct database imports

export const checkUserSubmissions = () => {
    return async (req, res, next) => {
        try {
            const { assignmentId} = req.body
            const userId = req.user.id;
            if (!(await Assignment.findById(assignmentId))) return res.status(404).json(ApiResponse.notFound("Böyle bir ödev bulunamadı."))

            const findSubmission = await Submission.findOne({assignment: assignmentId, student: userId})

            if (findSubmission) {
                return res.status(400).json(ApiResponse.error("Halilazırda ödev göndermişsiniz."))
            }

            return next();
        } catch (error) {
            console.error('Bildirim oluşturma hatası:', error);
            res.status(500).json(
                ApiResponse.serverError('Bildirim oluşturulurken bir hata oluştu', error)
            );
        }
    }
}