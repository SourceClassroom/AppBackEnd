import {Conversation} from "../models/conversationModel.js";
import {ConversationRead} from "../models/conversationReadModel.js";

/**
 * Create a new conversation between users
 * @param {Array} participants - Array of user IDs
 * @param {Boolean} isGroup - Whether this is a group conversation
 * @param {String} groupName - Name of the group (if isGroup is true)
 * @param groupOwner
 * @returns {Promise<Object>} - The created conversation
 */
export const createConversation = async (participants, isGroup = false, groupName = null, groupOwner, isPending) => {
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
               isGroup,
               isPending
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
            isGroup: false,
            isDeleted: false
        });
    } catch (error) {
        throw new Error(`Error finding private conversation: ${error.message}`);
    }
};


export const changeGroupImage = async (conversationId, groupImage) => {
    try {
        return await Conversation.findByIdAndUpdate(conversationId, {groupImage}, {new: true});
    } catch (error) {
        throw new Error(`Error changing group image: ${error.message}`);
    }
};

export const changeGroupName = async (conversationId, groupName) => {
    try {
        return await Conversation.findByIdAndUpdate(conversationId, {groupName}, {new: true});
    } catch (error) {
        throw new Error(`Error changing group name: ${error.message}`);
    }
};

export const approveConversation = async (conversationId) => {
    try {
        return await Conversation.findByIdAndUpdate(conversationId, {isPending: false}, {new: true});
    } catch (error) {
        throw new Error(`Error approving conversation: ${error.message}`);
    }
};

/**
 * Get a conversation by ID
 * @returns {Promise<Object>} - The conversation
 * @param conversationIds - Array of conversation IDs
 */
export const getMultiConversations = async (conversationIds) => {
    try {
        return await Conversation.find({ _id: { $in: conversationIds }, isDeleted: { $ne: true } })
            .select('_id isPending isGroup groupName groupImage groupOwner participants lastMessage mutedBy')
            .populate({
                path: 'lastMessage',
                model: 'Message'
            }).lean();
    } catch (error) {
        throw new Error(`Error getting conversations: ${error.message}`);
    }
};

export const muteConversation = async (conversationId, userId) => {
    try {
        return await Conversation.findByIdAndUpdate(conversationId, {$push: {mutedBy: userId}}, {new: true});
    } catch (error) {
        throw new Error(`Error muting conversation: ${error.message}`);
    }
};

export const unmuteConversation = async (conversationId, userId) => {
    try {
        return await Conversation.findByIdAndUpdate(conversationId, {$pull: {mutedBy: userId}}, {new: true});
    } catch (error) {
        throw new Error(`Error unmuting conversation: ${error.message}`);
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


export const updateUserReadStatus = async (userId, conversationId, messageId) => {
    try {
        await ConversationRead.findOneAndUpdate({ conversationId, userId }, {$set: {lastReadMessage: messageId}}, { upsert: true, new: true });
    } catch (error) {
        throw new Error(`Error updating user read status: ${error.message}`);
    }
};

/**
 * Get a conversation by its ID
 * @param {String} conversationId - The ID of the conversation to retrieve
 * @returns {Promise<Object>} - Promise that resolves to the conversation document
 * @throws {Error} - If there is an error retrieving the conversation
 */
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
        ).populate({
            path: 'lastMessage',
            model: 'Message'
        }).select('_id isPending isGroup groupName groupImage groupOwner participants lastMessage mutedBy').lean();
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