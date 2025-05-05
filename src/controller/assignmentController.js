import ApiResponse from "../utils/apiResponse.js";
import { processMedia } from "../services/fileService.js";
import { generateMonthKey } from "../utils/dateRange.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey, invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as weekCacheModule from '../cache/modules/weekModule.js';
import *as classCacheModule from '../cache/modules/classModule.js';
import *as assignmentCacheModule from '../cache/modules/assignmentModule.js';

//Database Modules
import *as weekDatabaseModule from '../database/modules/weekModule.js';
import *as classDatabaseModule from '../database/modules/classModule.js';
import *as eventDatabaseModule from '../database/modules/eventModule.js';
import *as assignmentDatabaseModule from '../database/modules/assignmentModule.js';

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
        const classExists = await classCacheModule.getCachedClassData(classId, classDatabaseModule.getClassById)
        if (!classExists) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }
        //Hafta Kontrolu
        if (week) {
            const weekExists = await weekCacheModule.getCachedWeekData(week, weekDatabaseModule.getWeekById)
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
        const newAssignment = await assignmentDatabaseModule.createAssignment(newAssignmentData);

        // Hafta veya sınıfa ödev ID'sini ekle
        if (week) {
            await weekDatabaseModule.pushAssignmentToWeek(week, newAssignment._id)
            await invalidateKey(`week:${week}:assignments`)
        } else {
            await classDatabaseModule.pushAssignmentToClass(classId, newAssignment._id)
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
        await eventDatabaseModule.createEvent(eventData)

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

        const classAssignments = await classCacheModule.getCachedClassAssignments(classId, classDatabaseModule.getClassAssignments);
        if (!classAssignments) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const assignmentsData = await multiGet(classAssignments, 'assignment', assignmentDatabaseModule.getMultiAssignments)

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

        const weekAssignments = await weekCacheModule.getCachedWeekAssignments(weekId, weekDatabaseModule.getWeekAssignments);
        if (!weekAssignments) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        const assignmentsData = await multiGet(weekAssignments, 'assignment', assignmentDatabaseModule.getMultiAssignments)

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
        const assignment = await assignmentDatabaseModule.getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı."));
        }

        // Ödevi güncelle
        const updatedAssignmentData = {
            title: title || assignment.title,
            description: description || assignment.description,
            dueDate: dueDate || assignment.dueDate,
        };

        const updatedAssignment = await assignmentDatabaseModule.updateAssignment(assignmentId, updatedAssignmentData);
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
        const assignment = await assignmentCacheModule.getCachedAssignment(assignmentId, assignmentDatabaseModule.getAssignmentById)
        if (!assignment) {
            return res.status(404).json(ApiResponse.notFound("Ödev bulunamadı."));
        }

        // Ödevi sil
        await assignmentDatabaseModule.deleteAssignment(assignmentId, req.user.id);
        await invalidateKeys([`assignment:${assignmentId}`])

        return res.status(200).json(ApiResponse.success("Ödev başarılı bir şekilde silindi.", null, 200));
    } catch (error) {
        console.error('Ödev silme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödev silinirken bir hata oluştu', error)
        );
    }
};