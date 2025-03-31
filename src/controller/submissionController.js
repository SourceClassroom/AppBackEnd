import ApiResponse from "../utils/apiResponse.js";
import {Class} from "../database/models/classModel.js";
import {processMedia} from "../services/fileService.js";
import {Assignment} from "../database/models/assignmentModel.js";
import {Submission} from "../database/models/submissionsModel.js";

export const getASubmission = async (req, res) => {

}

export const createSubmission = async (req, res) => {
    try {
        const { assignmentId, description } = req.body;

        const fileIds = await processMedia(req);

        const getAssignment = await Assignment.findById(assignmentId)
        if (!getAssignment) return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı"))

        const newSubmissionData = {
            assignment: assignmentId,
            student: req.user.id,
            description,
            attachments: fileIds
        }
        const newSubmission = await Submission.create(newSubmissionData)
        const updateAsssignment = await Assignment.findByIdAndUpdate(assignmentId, {$push: {submissions: [newSubmission._id]}})
        return res.status(201).json(ApiResponse.success("Gönderim başarıyla eklendi.", newSubmission, 201));
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Gönderim yüklenirken bir hata oluştu', error)
        );
    }
}

export const getSubmissions = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId
        if (!assignmentId) return res.status(400).json(ApiResponse.error("Ödev idsi gerkeli."))
        const assignment = await Assignment.findById(assignmentId)
            .populate({
                path: "submissions",
                populate: {
                    path: "student",
                    select: "name surname profile"
                },
                select: "description attachments"
            });
        console.log(assignment);
        if (!assignment) return res.status(404).json(ApiResponse.notFound("Bu ödev için gönderim bulunamadı"))
        const result = assignment.submissions.map(sub => ({
            submissionId: sub._id,
            description: sub.description,
            attachments: sub.attachments,
            student: sub.student ? {
                id: sub.student._id,
                name: sub.student.name,
                surname: sub.student.surname,
                avatar: sub.student.profile.avatar,
            } : null
        }));
        return res.status(200).json(ApiResponse.success("Ödeve eklenmiş tüm gönderimler.", result));
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Ödev verisi alınırken bir hata meydana geldi.', error)
        );
    }
}