import {UserBlock} from "../models/userBlockSchema.js";

export const blockUser = async (blockerId, blockedId) => {
    try {
        return await UserBlock.create({
            blocker: blockerId,
            blocked: blockedId,
        });
    } catch (error) {
        throw error;
    }
}

export const unblockUser = async (blockerId, blockedId) => {
    try {
        return await UserBlock.findOneAndDelete({
            blocker: blockerId,
            blocked: blockedId,
        });
    } catch (error) {
        throw error;
    }
}

export const getBlockData = async (blockerId, blockedId) => {
    try {
        return await UserBlock.findOne({
            blocker: blockerId,
            blocked: blockedId,
        });
    } catch (error) {
        throw error;
    }
}

export const isBlockBetWeen = async (userA, userB) => {
    try {
        return await UserBlock.findOne({
            $or: [
                {blocker: userA, blocked: userB},
                {blocker: userB, blocked: userA}
            ]
        });
    } catch (error) {
        throw error;
    }
}