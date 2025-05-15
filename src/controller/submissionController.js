import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as classCacheHandler from "../cache/handlers/classCacheHandler.js";
import *as submissionCacheHandler from '../cache/handlers/submissionCacheHandler.js';
import *as assignmentCacheHandler from "../cache/handlers/assignmentCacheHandler.js";

//Database Repositories
import *as userDatabaseRepository from "../database/repositories/userRepository.js";
import *as classDatabaseRepository from "../database/repositories/classRepository.js";
import *as submissionDatabaseRepository from '../database/repositories/submissionRepository.js';
import *as assignmentDatabaseRepository from "../database/repositories/assignmentRepository.js";

//Notifications
import notifyUser from "../notifications/notifyUser.js";

export const getUserSubmissions = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId
        const userId = req.user.id

        const submissions = await submissionCacheHandler.getCachedUserSubmissions(userId, assignmentId, submissionDatabaseRepository.getUserSubmission)
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

        const submissionData = await submissionCacheHandler.getCachedSubmissionById(submissionId, submissionDatabaseRepository.getSubmissionById)
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
        const newSubmission = await submissionDatabaseRepository.createSubmission(newSubmissionData)
        await assignmentDatabaseRepository.pushSubmissionToAssignment(assignmentId, newSubmission._id)
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

        const submissions = await assignmentCacheHandler.getCachedSubmissions(assignmentId, assignmentDatabaseRepository.getAssignmentSubmissions)
        if (!submissions) return res.status(404).json(ApiResponse.notFound("Bu ödev için gönderim bulunamadı"))

        const submissionsData = (await multiGet(submissions, "submission", submissionDatabaseRepository.getMultiSubmissions))
            .map(sub => sub.toObject ? sub.toObject() : sub);

        const users = submissionsData.map(sub => sub.student);
        const userData = (await multiGet(users, "user", userDatabaseRepository.getMultiUserById))
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

        const submission = await submissionCacheHandler.getCachedSubmissionById(submissionId, submissionDatabaseRepository.getSubmissionById)
        const assignment = await assignmentCacheHandler.getCachedAssignment(submission.assignment, assignmentDatabaseRepository.getAssignmentById)
        const classData = await classCacheHandler.getCachedClassData(assignment.classroom, classDatabaseRepository.getClassById)

        const updateSubmission = await submissionDatabaseRepository.setReview(submissionId, feedback, grade)
        if (!updateSubmission) return res.status(404).json(ApiResponse.notFound("Gönderim bulunamadı."))
        await invalidateKeys([`submission:${submissionId}`, `user:${updateSubmission.student}:submission:${updateSubmission.assignment}`])

        const notificationData = {
            type: "assignment_graded",
            classId,
            subject: `${assignment.title} ödeviniz puanlandı`,
            classTitle: classData.title,
            message: feedback ? `${feedback.slice(0, 30)}...` : "Geri dönüş belirtilmemiş",
            path: `${process.env.FRONTEND_URL}/class/${assignment.classroom}/homeworks`,
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