import ApiResponse from "../utils/apiResponse.js";
import { processMedia } from "../services/fileService.js";

//Cache Strategies
import {invalidateKey, invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as weekCacheModule from '../cache/modules/weekModule.js';
import *as classCacheModule from '../cache/modules/classModule.js';
import *as assignmentCacheModule from '../cache/modules/assignmentModule.js';

//Database Modules
import *as weekDatabaseModule from '../database/modules/weekModule.js';
import *as classDatabaseModule from '../database/modules/classModule.js';
import *as assignmentDatabaseModule from '../database/modules/assignmentModule.js';


/**
 * Ödev oluşturma
 * @route POST /api/assignment/create
 * @access Private [teacher, sysadmin]
 */
export const createAssignment = async (req, res) => {
    try {
        const { classId, title, description, dueDate, week } = req.body;

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
            const updateWeek = await weekDatabaseModule.pushAssignmentToWeek(week, newAssignment._id)
            const updatedAssignments = await assignmentDatabaseModule.getAssignmentsByWeekId(week);
            await assignmentCacheModule.writeAssignmnetToCacheByWeek(week, updatedAssignments, 3600)
        } else {
            const updateClass = await classDatabaseModule.pushAssignmentToClass(classId, newAssignment._id)
            const updatedAssignments = await classDatabaseModule.getAssignmentsByClassId(classId);
            await assignmentCacheModule.writeAssignmnetToCacheByClass(classId, updatedAssignments, 3600)
        }

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

        const assignments = await assignmentCacheModule.getCachedClassAssignments(classId, classDatabaseModule.getAssignmentsByClassId);
        if (!assignments) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        return res.status(200).json(
            ApiResponse.success("Ödevler başarılı bir şekilde getirildi.", assignments, 200)
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

        const assignments = await assignmentCacheModule.getCachedWeekAssignments(weekId, weekDatabaseModule.getAssignmentsByWeekId);
        if (!assignments) {
            return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
        }

        return res.status(200).json(
            ApiResponse.success("Ödevler başarılı bir şekilde getirildi.", assignments, 200)
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
        await invalidateKeys([`class:${updatedAssignment.classroom}:assignments`, `week:${updatedAssignment.week}:assignments`])

        return res.status(200).json(ApiResponse.success("Ödev başarılı bir şekilde güncellendi.", updatedAssignment, 200));
    } catch (error) {
        console.error('Ödev güncelleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödev güncellenirken bir hata oluştu', error)
        );
    }
};