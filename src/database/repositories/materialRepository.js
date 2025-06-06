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
        return await Material.find({ _id: { $in: materialIds }, isDeleted: false })
            .populate({
                path: 'attachments',
                select: '_id originalname size',
            })
            .sort({ createdAt: -1 });
    } catch (error) {
        throw error;
    }
};

export const deleteMaterial = async (materialId, deletedBy) => {
    try {
        return await Material.findByIdAndUpdate(materialId, { isDeleted: true, deletedBy, deletedAt: new Date()}, { new: true });
    } catch (error) {
        throw error;
    }
};

export const updateMaterial = async (materialId, data) => {
    try {
        return await Material.findByIdAndUpdate(materialId, data, { new: true });
    } catch (error) {
        throw error;
    }
};