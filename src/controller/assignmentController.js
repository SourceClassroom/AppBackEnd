import ApiResponse from "../utils/apiResponse.js";
import { processMedia } from "../services/fileService.js";
import { generateMonthKey } from "../utils/dateRange.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey, invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as weekCacheHandler from '../cache/handlers/weekCacheHandler.js';
import *as classCacheHandler from '../cache/handlers/classCacheHandler.js';
import *as assignmentCacheHandler from '../cache/handlers/assignmentCacheHandler.js';

//Database Repositories
import *as weekDatabaseRepository from '../database/repositories/weekRepository.js';
import *as classDatabaseRepository from '../database/repositories/classRepository.js';
import *as eventDatabaseRepository from '../database/repositories/eventRepository.js';
import *as assignmentDatabaseRepository from '../database/repositories/assignmentRepository.js';

//Notifications
import notifyClassroom from "../notifications/notifyClassroom.js";


/**
 * Ödev oluşturma
 * @route POST /api/assignment/create
 * @access Private [teacher, sysadmin]
 */
export const createAssignment = async (req, res) => {
    try {
        const { classId, title, description, dueDate, week } = req.body;
        req.body.permission = 1

        // Sınıfı getir
        const classExists = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)
        if (!classExists) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }
        //Hafta Kontrolu
        if (week) {
            const weekExists = await weekCacheHandler.getCachedWeekData(week, weekDatabaseRepository.getWeekById)
            if (!weekExists) {
                return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
            }
        }

        const fileIds = await processMedia(req);

        const newAssignmentData = {
            classroom: classId,
            author: req.user.id,
            title,
            description,
            dueDate,
            week,
            attachments: fileIds,
        };

        // Ödev oluştur
        const newAssignment = await assignmentDatabaseRepository.createAssignment(newAssignmentData);

        // Hafta veya sınıfa ödev ID'sini ekle
        if (week) {
            await weekDatabaseRepository.pushAssignmentToWeek(week, newAssignment._id)
            await invalidateKey(`week:${week}:assignments`)
        } else {
            await classDatabaseRepository.pushAssignmentToClass(classId, newAssignment._id)
            await invalidateKey(`class:${classId}:assignments`)
        }

        const eventData = {
            classId,
            title: `${title} Ödev Teslimi.`,
            description: description.slice(0, 20) || "Açıklama belirtilmemiş",
            date: dueDate,
            type: "assignment_due",
            visibility: "class",
            metadata: {
                createdBy: req.user.id,
                tags: ["ödev"],
                color: "#2b7fff"
            }
        }
        const monthKey = generateMonthKey(dueDate)
        await invalidateKey(`events:${classId}:${monthKey}`)
        await eventDatabaseRepository.createEvent(eventData)

        const notificationData = {
            type: "new_assignment",
            classId,
            subject: `${classExists.title} sınıfında yeni bir ödev oluşturuldu.`,
            classTitle: classExists.title,
            message: description.slice(0, 20) || "Açıklama belirtilmemiş",
            path: `${process.env.FRONTEND_URL}/class/${classId}/homeworks`,
            actionText: "Ödeve git",
        }

        notifyClassroom(classId, notificationData)

        return res.status(201).json(ApiResponse.success("Ödev başarılı bir şekilde oluşturuldu.", newAssignment, 201));
    } catch (error) {
        console.error('Ödev oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödev oluşturulurken bir hata oluştu', error)
        );
    }
};

export const getClassAssignments = async (req, res) => {
    try {
        const { classId } = req.params;

        const classAssignments = await classCacheHandler.getCachedClassAssignments(classId, classDatabaseRepository.getClassAssignments);
        if (!classAssignments) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const assignmentsData = await multiGet(classAssignments, 'assignment', assignmentDatabaseRepository.getMultiAssignments)

        return res.status(200).json(
            ApiResponse.success("Ödevler başarılı bir şekilde getirildi.", assignmentsData, 200)
        );
    } catch (error) {
        console.error('Ödevleri getirme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödevler getirilirken bir hata oluştu', error)
        );
    }
};

export const getWeekAssignments = async (req, res) => {
    try {
        const { weekId } = req.params;

        const weekAssignments = await weekCacheHandler.getCachedWeekAssignments(weekId, weekDatabaseRepository.getWeekAssignments);
        if (!weekAssignments) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        const assignmentsData = await multiGet(weekAssignments, 'assignment', assignmentDatabaseRepository.getMultiAssignments)

        return res.status(200).json(
            ApiResponse.success("Ödevler başarılı bir şekilde getirildi.", assignmentsData, 200)
        );
    } catch (error) {
        console.error('Ödevleri getirme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödevler getirilirken bir hata oluştu', error)
        );
    }
};

export const updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { title, description, dueDate } = req.body;

        // Ödevi getir
        const assignment = await assignmentDatabaseRepository.getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı."));
        }

        // Ödevi güncelle
        const updatedAssignmentData = {
            title: title || assignment.title,
            description: description || assignment.description,
            dueDate: dueDate || assignment.dueDate,
        };

        const updatedAssignment = await assignmentDatabaseRepository.updateAssignment(assignmentId, updatedAssignmentData);
        await invalidateKeys([`assignment:${assignmentId}`])

        return res.status(200).json(ApiResponse.success("Ödev başarılı bir şekilde güncellendi.", updatedAssignment, 200));
    } catch (error) {
        console.error('Ödev güncelleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödev güncellenirken bir hata oluştu', error)
        );
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Ödevi getir
        const assignment = await assignmentCacheHandler.getCachedAssignment(assignmentId, assignmentDatabaseRepository.getAssignmentById)
        if (!assignment) {
            return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı."));
        }

        // Ödevi sil
        await assignmentDatabaseRepository.deleteAssignment(assignmentId, req.user.id);
        await invalidateKeys([`assignment:${assignmentId}`])

        return res.status(200).json(ApiResponse.success("Ödev başarılı bir şekilde silindi.", null, 200));
    } catch (error) {
        console.error('Ödev silme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödev silinirken bir hata oluştu', error)
        );
    }
};