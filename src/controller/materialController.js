import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey} from "../cache/strategies/invalidate.js";

//Cache Modules
import *as classCacheModule from "../cache/modules/classModule.js";

import *as materialCacheModule from "../cache/modules/materialModule.js";
//Database Modules
import *as classDatabaseModule from "../database/modules/classModule.js";
import *as materialDatabaseModule from "../database/modules/materialModule.js";

export const createMaterial = async (req, res) => {
    try {
        const { classId, title, description, week } = req.body;

        const fileIds = await processMedia(req);

        const newMaterialData = {
            classroom: classId,
            title,
            description,
            week,
            attachments: fileIds,
        };

        const material = await materialDatabaseModule.createMaterial(newMaterialData);
        await classDatabaseModule.pushMaterialToClass(classId, material._id)
        await invalidateKey(`class:${classId}:materials`)

        res.status(201).json(ApiResponse.success("Materyel başarıyla oluşturuldu.", material, 201));
    } catch (error) {
        res.status(500).json(ApiResponse.serverError("Materyel oluşturulurken bir hata meydana geldi.", error));
    }
};

export const getClassMaterials = async (req, res) => {
    try {
        const { classId } = req.params;

        const classMaterials = await classCacheModule.getCachedClassMaterials(classId, classDatabaseModule.getClassMaterials);

        const materials = await multiGet(classMaterials, 'material', materialDatabaseModule.getMultiMaterials)

        res.status(200).json(ApiResponse.success("Materyaller başarıyla getirildi.", materials, 200));
    } catch (error) {
        console.log(error)
        res.status(500).json(ApiResponse.serverError("Materyaller getirilirken bir hata meydana geldi.", error));
    }
};
