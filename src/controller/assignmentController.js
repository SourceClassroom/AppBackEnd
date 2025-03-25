import ApiResponse from "../utils/apiResponse.js";
import { Week } from "../database/models/weekModel.js";
import { Class } from "../database/models/classModel.js";
import { Assignment } from '../database/models/assignmentModel.js';
import {createAttachmentOnDB} from "../services/fileService.js";

/**
 * Ödev oluşturma
 * @route POST /api/assignment/create
 * @access Private [teacher, sysadmin]
 */
const createAssignment = async (req, res) => {
    try {
        const { classId, title, description, dueDate, week } = req.body;

        // Sınıfı getir
        const getClassData = await Class.findById(classId);
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        // Dosyaları işle
        let files = [];
        if (req.files && req.files.length > 0) {
            files = req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: file.path,
                size: file.size,
                classId,
                userId: req.user?.id,
                uploadDate: Date.now()
            }));
        }
        console.log(files);
        let fileIds=[]
        for (const file of files) {
            const newAttach = await createAttachmentOnDB(file)
            fileIds.push(newAttach._id);
        }

        const newAssignmentData = {
            classroom: classId,
            author: req.user.id,
            title,
            description,
            dueDate,
            week,
            attachments: fileIds,
        };

        // Hafta kontrolü
        if (week) {
            const getWeekData = await Week.findById(week);
            if (!getWeekData) {
                return res.status(404).json(ApiResponse.notFound("Hafta bulunamadı."));
            }
        }

        // Ödev oluştur
        const newAssignment = await Assignment.create(newAssignmentData);

        // Hafta veya sınıfa ödev ID'sini ekle
        if (week) {
            await Week.findByIdAndUpdate(week, { $push: { assignments: newAssignment._id } });
        } else {
            await Class.findByIdAndUpdate(classId, { $push: { assignments: newAssignment._id } });
        }

        return res.status(201).json(ApiResponse.success("Ödev başarılı bir şekilde oluşturuldu.", newAssignment, 201));
    } catch (error) {
        console.error('Ödev oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Ödev oluşturulurken bir hata oluştu', error)
        );
    }
};

export { createAssignment };