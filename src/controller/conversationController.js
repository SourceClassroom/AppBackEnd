import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";

//Cache Modules
import * as conversationCacheModule from "../cache/modules/conversationModule.js";

//Database Modules
import * as messageDatabaseModule from "../database/modules/messageModule.js";
import * as conversationDatabaseModule from "../database/modules/conversationModule.js";


/**
 * Create a new conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createConversation = async (req, res) => {
    try {
        const creatorId = req.user.id;
        const { participants, isGroup, groupName } = req.body;
        if (!Array.isArray(participants) || participants.length === 0) {
            throw new Error("At least one participant is required");
        }

        const allParticipants = [
            ...new Set([creatorId.toString(), ...participants.map(p => p.toString())])
        ];

        if (!isGroup) {
            if (allParticipants.length !== 2) {
                return res.status(400).json(ApiResponse.error("Sohbet olusturulurken 2 kisi secilmeli", null));
            }

            // Aynı konuşma varsa onu döndür
            const existing = await conversationDatabaseModule.findPrivateConversation(allParticipants)

            if (existing) return res.status(400).json(ApiResponse.error("Bu konuşma zaten var", existing));
        } else {
            if (!groupName) {
                return res.status(400).json(ApiResponse.error("Grup ismi gereklidir", null));
            }
        }

        // Yeni konuşmayı oluştur
        const conversation = await conversationDatabaseModule.createConversation(
            allParticipants,
            isGroup,
            groupName,
            creatorId
        );

        return res.status(201).json(ApiResponse.success("Sohbet olusturuldu.", conversation));
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

/**
 * Get all conversations for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id
        const conversations = await conversationCacheModule.getUserConversations(userId, conversationDatabaseModule.getUserConversations)

        const conversationData = await multiGet(conversations, conversation, conversationDatabaseModule.getMultiConversations)
        
        const conversationsWithReadStatus = conversationData.map(conversation => ({
            ...conversation,
            isRead: conversation.lastMessage ? conversation.lastMessage.readBy.includes(userId) : true
        }));

        return res.status(200).json(ApiResponse.success("Sohbetler getirildi", conversationsWithReadStatus))
    } catch (error) {
        console.error(error)
        res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

/**
 * Add a participant to a group conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addParticipant = async (req, res) => {
    try {
        const { conversationId, userId } = req.body;
        
        // Get the conversation to check if the current user is a participant
        const conversation = await conversationModule.getConversationById(conversationId);
        
        const isParticipant = conversation.participants.some(
            participant => participant._id.toString() === req.user.id
        );
        
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }
        
        const updatedConversation = await conversationModule.addParticipant(conversationId, userId);
        
        res.status(200).json({
            success: true,
            data: updatedConversation
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Remove a participant from a group conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeParticipant = async (req, res) => {
    try {
        const { conversationId, userId } = req.body;
        
        // Get the conversation to check if the current user is a participant
        const conversation = await conversationModule.getConversationById(conversationId);
        
        const isParticipant = conversation.participants.some(
            participant => participant._id.toString() === req.user.id
        );
        
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }
        
        const updatedConversation = await conversationModule.removeParticipant(conversationId, userId);
        
        res.status(200).json({
            success: true,
            data: updatedConversation
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteConversation = async (req, res) => {
    try {
        // Get the conversation to check if the current user is a participant
        const conversation = await conversationModule.getConversationById(req.params.id);
        
        const isParticipant = conversation.participants.some(
            participant => participant._id.toString() === req.user.id
        );
        
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }
        
        await conversationModule.deleteConversation(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};