import {Conversation} from "../models/conversationModel.js";

/**
 * Create a new conversation between users
 * @param {Array} participants - Array of user IDs
 * @param {Boolean} isGroup - Whether this is a group conversation
 * @param {String} groupName - Name of the group (if isGroup is true)
 * @param groupOwner
 * @returns {Promise<Object>} - The created conversation
 */
export const createConversation = async (participants, isGroup = false, groupName = null, groupOwner) => {
    try {
       if (isGroup) {
           return await Conversation.create({
               participants,
               isGroup,
               groupName,
               groupOwner
           });
       } else {
           return await Conversation.create({
               participants,
               isGroup
           });
       }
    } catch (error) {
        throw new Error(`Error creating conversation: ${error.message}`);
    }
};

export const findPrivateConversation = async (allParticipants) => {
    try {
        return await Conversation.findOne({
            participants: {$all: allParticipants, $size: 2},
            isGroup: false
        });
    } catch (error) {
        throw new Error(`Error finding private conversation: ${error.message}`);
    }
};

/**
 * Get a conversation by ID
 * @param {String} conversationId - The conversation ID
 * @returns {Promise<Object>} - The conversation
 */
export const getMultiConversations = async (conversationIds) => {
    try {
        return await Conversation.find({
            _id: { $in: conversationIds },
            isDeleted: { $ne: true }
        }).populate('lastMessage').lean();
    } catch (error) {
        throw new Error(`Error getting conversations: ${error.message}`);
    }
};

/**
 * Get all conversations for a user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - Array of conversations
 */
export const getUserConversations = async (userId) => {
    try {
        return await Conversation.find({
            participants: userId,
            isDeleted: { $ne: true }
        })
        .select('_id')
        .lean();
    } catch (error) {
        throw new Error(`Error getting user conversations: ${error.message}`);
    }
};

export const getConversationById = async (conversationId) => {
    try {
        return await Conversation.findById(conversationId).lean();
    } catch (error) {
        throw new Error(`Error getting conversation: ${error.message}`);
    }
};

/**
 * Update the last message of a conversation
 * @param {String} conversationId - The conversation ID
 * @param {String} messageId - The message ID
 * @returns {Promise<Object>} - The updated conversation
 */
export const updateLastMessage = async (conversationId, messageId) => {
    try {
        return await Conversation.findByIdAndUpdate(
            conversationId,
            {lastMessage: messageId},
            {new: true}
        );
    } catch (error) {
        throw new Error(`Error updating last message: ${error.message}`);
    }
};

/**
 * Add a participant to a group conversation
 * @param {String} conversationId - The conversation ID
 * @param {String} userId - The user ID to add
 * @returns {Promise<Object>} - The updated conversation
 */
export const addParticipant = async (conversationId, userId) => {
    try {
        return await Conversation.findByIdAndUpdate(
            conversationId,
            {$push: {participants: userId}},
            {new: true}
        );
    } catch (error) {
        throw new Error(`Error adding participant: ${error.message}`);
    }
};

/**
 * Remove a participant from a conversation
 * @param {String} conversationId - The conversation ID
 * @param {String} userId - The user ID to remove
 * @returns {Promise<Object>} - The updated conversation
 */
export const removeParticipant = async (conversationId, userId) => {
    try {
        return await Conversation.findByIdAndUpdate(
            conversationId,
            {$pull: {participants: userId}},
            {new: true}
        );
    } catch (error) {
        throw new Error(`Error removing participant: ${error.message}`);
    }
};
/**
 * Soft delete a conversation
 * @param {String} conversationId - The conversation ID
 * @returns {Promise<Object>} - The deleted conversation
 */
export const deleteConversation = async (conversationId, deletedBy) => {
    try {
        return await Conversation.findByIdAndUpdate(
            conversationId,
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy
            },
            {new: true}
        );
    } catch (error) {
        throw new Error(`Error deleting conversation: ${error.message}`);
    }
};