import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as classCacheModule from "../cache/modules/classModule.js";
import *as submissionCacheModule from '../cache/modules/submissionModule.js';
import *as assignmentCacheModule from "../cache/modules/assignmentModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
import *as classDatabaseModule from "../database/modules/classModule.js";
import *as submissionDatabaseModule from '../database/modules/submissionModule.js';
import *as assignmentDatabaseModule from "../database/modules/assignmentModule.js";

//Notifications
import notifyUser from "../notifications/notifyUser.js";

export const getUserSubmissions = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId
        const userId = req.user.id

        const submissions = await submissionCacheModule.getCachedUserSubmissions(userId, assignmentId, submissionDatabaseModule.getUserSubmission)
        if (!submissions) return res.status(404).json(ApiResponse.notFound("Gönderim bulunamadı."))

        return res.status(200).json(ApiResponse.success("Gönderim verisi.", submissions));
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Gönderim verisi alinirken bir hata oluştu', error)
        );
    }
}

export const getASubmission = async (req, res) => {
    try {
        const submissionId = req.params.submissionId;

        const submissionData = await submissionCacheModule.getCachedSubmissionById(submissionId, submissionDatabaseModule.getSubmissionById)
        if (!submissionData) return res.status(404).json(ApiResponse.notFound("Gönderim bulunamadı."))

        return res.status(200).json(ApiResponse.success("Gönderim verisi.", submissionData));
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Gönderim verisi alinirken bir hata oluştu', error)
        );
    }
}

export const createSubmission = async (req, res) => {
    try {
        const { assignmentId, description } = req.body;
        req.body.permission = 2

        const getAssignment = await assignmentCacheModule.getCachedAssignment(assignmentId, assignmentDatabaseModule.getAssignmentById)
        if (!getAssignment) return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı"))

        //Check assignment dueDate
        const currentDate = new Date();
        const dueDate = new Date(getAssignment.dueDate)
        if (currentDate > dueDate) {
            return res.status(400).json(ApiResponse.error("Ödev için son gönderim tarihi geçmiş."));
        }
        const fileIds = await processMedia(req);

        const newSubmissionData = {
            assignment: assignmentId,
            student: req.user.id,
            description,
            attachments: fileIds
        }
        const newSubmission = await submissionDatabaseModule.createSubmission(newSubmissionData)
        await assignmentDatabaseModule.pushSubmissionToAssignment(assignmentId, newSubmission._id)
        await invalidateKeys([`assignment:${assignmentId}`])

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

        const submissions = await assignmentCacheModule.getCachedSubmissions(assignmentId, assignmentDatabaseModule.getAssignmentSubmissions)
        if (!submissions) return res.status(404).json(ApiResponse.notFound("Bu ödev için gönderim bulunamadı"))

        const submissionsData = (await multiGet(submissions, "submission", submissionDatabaseModule.getMultiSubmissions))
            .map(sub => sub.toObject ? sub.toObject() : sub);

        const users = submissionsData.map(sub => sub.student);
        const userData = (await multiGet(users, "user", userDatabaseModule.getMultiUserById))
            .map(u => u.toObject ? u.toObject() : u);

        const responseData = submissionsData.map(submission => {
            const user = userData.find(u => u._id.toString() === submission.student.toString());
            return {
                ...submission,
                student: {
                    name: user.name,
                    surname: user.surname,
                    profile: {
                        avatar: user.profile?.avatar
                    }
                }
            };
        });

        return res.status(200).json(ApiResponse.success("Ödeve eklenmiş tüm gönderimler.", responseData));
    } catch (error) {
        console.log(error)
        res.status(500).json(
            ApiResponse.serverError('Ödev verisi alınırken bir hata meydana geldi.', error)
        );
    }
}

export const reviewSubmission = async (req, res) => {
    try {
        const { submissionId, feedback, grade } = req.body

        const submission = await submissionCacheModule.getCachedSubmissionById(submissionId, submissionDatabaseModule.getSubmissionById)
        const assignment = await assignmentCacheModule.getCachedAssignment(submission.assignment, assignmentDatabaseModule.getAssignmentById)
        const classData = await classCacheModule.getCachedClassData(assignment.classroom, classDatabaseModule.getClassById)

        const updateSubmission = await submissionDatabaseModule.setReview(submissionId, feedback, grade)
        if (!updateSubmission) return res.status(404).json(ApiResponse.notFound("Gönderim bulunamadı."))
        await invalidateKeys([`submission:${submissionId}`, `user:${updateSubmission.student}:submission:${updateSubmission.assignment}`])

        const notificationData = {
            type: "assignment_graded",
            subject: `${assignment.title} ödeviniz puanlandı`,
            classTitle: classData.title,
            message: feedback ? feedback : "Geri dönüş belirtilmemiş",
            path: `${process.env.FRONTEND_URL}/class/${assignment.classroom}`,
            actionText: "Sınıfa git",
        }

        notifyUser(submission.student._id, notificationData)

        return res.status(200).json(ApiResponse.success("Feedback başarı ile girildi.", updateSubmission))
    } catch (error) {
        console.error(error)
        res.status(500).json(
            ApiResponse.serverError('Feedback girilirken bir hata meydana geldi.', error)
        );
    }
}
