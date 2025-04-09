import ApiResponse from "../utils/apiResponse.js";
import {Class} from "../database/models/classModel.js";
import {processMedia} from "../services/fileService.js";
import *as cacheService from "../services/cacheService.js";
import {Assignment} from "../database/models/assignmentModel.js";
import {Submission} from "../database/models/submissionsModel.js";

//Cache Modules
import *as submissionCacheModule from '../cache/modules/submissionModule.js';
import *as assignmentCacheModule from "../cache/modules/assignmentModule.js";

//Database Modules
import *as submissionDatabaseModule from '../database/modules/submissionModule.js';
import *as assignmentDatabaseModule from "../database/modules/assignmentModule.js";
import {invalidateKeys} from "../cache/strategies/invalidate.js";
import {getAssignmentSubmissions} from "../database/modules/assignmentModule.js";

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

        const getAssignment = await assignmentCacheModule.getCachedAssignment(assignmentId, assignmentDatabaseModule.getAssignmentById)
        if (!getAssignment) return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı"))

        const fileIds = await processMedia(req);

        const newSubmissionData = {
            assignment: assignmentId,
            student: req.user.id,
            description,
            attachments: fileIds
        }
        const newSubmission = await submissionDatabaseModule.createSubmission(newSubmissionData)
        const updateAsssignment = await assignmentDatabaseModule.pushSubmissionToAssignment(assignmentId, newSubmission._id)
        await invalidateKeys([`submissions:${assignmentId}`, `assignment:${assignmentId}:submissions`])

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

        return res.status(200).json(ApiResponse.success("Ödeve eklenmiş tüm gönderimler.", submissions));
    } catch (error) {
        console.log(error)
        res.status(500).json(
            ApiResponse.serverError('Ödev verisi alınırken bir hata meydana geldi.', error)
        );
    }
}

//TODO test new functions

export const gradeSubmission = async (req, res) => {
    try {
        const { submissionId, grade } = req.body
        //TODO add validator

        const updateSubmission = await submissionDatabaseModule.setGrade(submissionId, grade)
        if (!updateSubmission) return res.status(404).json(ApiResponse.notFound("Gönderim bulunamadı."))
        await invalidateKeys([`submission:${submissionId}`, `assignmnet:${updateSubmission.assignment}:submissions`])

        return res.status(200).json(ApiResponse.success("Ödev notu başarı ile girildi.", updateSubmission))
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Not verilirken bir hata meydana geldi.', error)
        );
    }
}

export const feedbackSubmission = async (req, res) => {
    try {
        const { submissionId, feedback } = req.body

        const updateSubmission = await submissionDatabaseModule.setFeedback(submissionId, feedback)
        if (!updateSubmission) return res.status(404).json(ApiResponse.notFound("Gönderim bulunamadı."))
        await invalidateKeys([`submission:${submissionId}`, `assignmnet:${updateSubmission.assignment}:submissions`])

        return res.status(200).json(ApiResponse.success("Feedback başarı ile girildi.", updateSubmission))
    } catch (error) {
        res.status(500).json(
            ApiResponse.serverError('Feedback girilirken bir hata meydana geldi.', error)
        );
    }
}