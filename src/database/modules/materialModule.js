import { Material } from "../models/materialModel.js";

export const createMaterial = async (data) => {
    try {
        return await Material.create(data);
    } catch (error) {
        throw error;
    }
};

export const getMultiMaterials = async (materialIds) => {
    try {
        return await Material.find({ _id: { $in: materialIds } })
            .populate({
                path: 'attachments',
                select: '_id originalname size',
            })
            .sort({ createdAt: -1 });
    } catch (error) {
        throw error;
    }
};