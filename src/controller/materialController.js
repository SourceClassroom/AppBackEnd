import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey} from "../cache/strategies/invalidate.js";

//Cache Handlers
import *as weekCacheHandler from "../cache/handlers/weekCacheHandler.js";
import *as classCacheHandler from "../cache/handlers/classCacheHandler.js";

//Database Repositories
import *as weekDatabaseRepository from "../database/repositories/weekRepository.js";
import *as classDatabaseRepository from "../database/repositories/classRepository.js";
import *as materialDatabaseRepository from "../database/repositories/materialRepository.js";

//Notifications
import notifyClassroom from "../notifications/notifyClassroom.js";

export const createMaterial = async (req, res) => {
    try {
        const { classId, title, description, week } = req.body;
        req.body.permission = 1

        const fileIds = await processMedia(req);

        const newMaterialData = {
            classroom: classId,
            title,
            description,
            week,
            attachments: fileIds,
        };

        const classExists = await classCacheHandler.getCachedClassData(classId, classDatabaseRepository.getClassById)
        if (!classExists) {
            return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        }

        const material = await materialDatabaseRepository.createMaterial(newMaterialData);
        if (week) {
            await weekDatabaseRepository.pushMaterialToWeek(week, material._id)
            await invalidateKey(`week:${week}:materials`)
        }
        else {
            await classDatabaseRepository.pushMaterialToClass(classId, material._id)
            await invalidateKey(`class:${classId}:materials`)
        }


        const notificationData = {
            type: "new_material",
            classId,
            subject: `${classExists.title} sınıfına yeni bir materyal oluşturuldu.`,
            classTitle: classExists.title,
            message: `${description.slice(0, 30)}...`  || "Açıklama belirtilmemiş",
            path: `${process.env.FRONTEND_URL}/class/${classId}/materials`,
            actionText: "Sınıfa git",
        }

        notifyClassroom(classId, notificationData)

        res.status(201).json(ApiResponse.success("Materyel başarıyla oluşturuldu.", material, 201));
    } catch (error) {
        console.error(error)
        res.status(500).json(ApiResponse.serverError("Materyel oluşturulurken bir hata meydana geldi.", error));
    }
};

export const updateMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { title, description } = req.body;

        const fileIds = await processMedia(req);

        const currentAttachments = req.body.attachments ? JSON.parse(req.body.attachments) : [];

        const updatedMaterialData = {
            title,
            description,
            attachments: currentAttachments.concat(fileIds),
        };

        const updatedMaterial = await materialDatabaseRepository.updateMaterial(materialId, updatedMaterialData);
        await invalidateKey(`material:${materialId}`)

        res.status(200).json(ApiResponse.success("Materyal başarıyla güncellendi.", updatedMaterial, 200));
    } catch (error) {
        console.error(error)
        res.status(500).json(ApiResponse.serverError("Materyal güncellenirken bir hata meydana geldi.", error));
    }
};

export const getClassMaterials = async (req, res) => {
    try {
        const { classId } = req.params;

        const classMaterials = await classCacheHandler.getCachedClassMaterials(classId, classDatabaseRepository.getClassMaterials);

        const materials = await multiGet(classMaterials, 'material', materialDatabaseRepository.getMultiMaterials)

        res.status(200).json(ApiResponse.success("Materyaller başarıyla getirildi.", materials, 200));
    } catch (error) {
        console.log(error)
        res.status(500).json(ApiResponse.serverError("Materyaller getirilirken bir hata meydana geldi.", error));
    }
};

export const getWeekMaterials = async (req, res) => {
    try {
        const { classId, weekId } = req.params;

        const weekMaterials = await weekCacheHandler.getCachedWeekMaterials(weekId, weekDatabaseRepository.getWeekMaterials);

        const materials = await multiGet(weekMaterials, 'material', materialDatabaseRepository.getMultiMaterials)

        res.status(200).json(ApiResponse.success("Materyaller başarıyla getirildi.", materials, 200));
    } catch (error) {
        console.log(error)
        res.status(500).json(ApiResponse.serverError("Materyaller getirilirken bir hata meydana geldi.", error));
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;

        await materialDatabaseRepository.deleteMaterial(materialId, req.user.id);
        await invalidateKey(`material:${materialId}`)

        res.status(200).json(ApiResponse.success("Materyal başarıyla silindi.", null, 200));
    } catch (error) {
        res.status(500).json(ApiResponse.serverError("Materyal silinirken bir hata meydana geldi.", error));
    }
};