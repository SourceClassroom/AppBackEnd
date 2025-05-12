import ApiResponse from "../utils/apiResponse.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey, invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Modules
import * as conversationCacheModule from "../cache/modules/conversationModule.js";
import * as conversationReadCacheModule from "../cache/modules/conversationReadModule.js";

//Database Modules
import * as userDatabaseModule from "../database/modules/userModule.js";
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

        // Invalidate cache for all participants
        await invalidateKeys(allParticipants.map(userId => `user:${userId}:conversations`));

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
        const userId = req.user.id;

        // 1. Kullanıcının sohbetlerini al
        const conversations = await conversationCacheModule.getUserConversations(
            userId,
            conversationDatabaseModule.getUserConversations
        );

        if (!conversations || conversations.length === 0) {
            return res.status(200).json(
                ApiResponse.success("Sohbetler getirildi", [])
            );
        }

        // 2. Konuşma detaylarını al
        const conversationData = await multiGet(
            conversations,
            "conversation",
            conversationDatabaseModule.getMultiConversations
        );

        // 3. Her konuşma için katılımcıların bilgilerini al
        const participantsData = await Promise.all(
            conversationData.map(conversation =>
                multiGet(
                    conversation.participants,
                    "user",
                    userDatabaseModule.getMultiUserById
                )
            )
        );

        // 4. Katılımcı bilgilerini konuşmalara ekle
        conversationData.forEach((conversation, index) => {
            conversation.participants = participantsData[index].map(user => ({
                _id: user._id,
                name: user.name,
                surname: user.surname,
                profile: {
                    avatar: user?.profile?.avatar
                },
            }));
        });

        // 5. Tüm konuşmalardaki tüm kullanıcıların okuma durumlarını getir
        const readStatusPromises = conversationData.map(async conversation => {
            const conversationId = conversation._id.toString();
            const cachedStatus = await conversationReadCacheModule.getConversationReadStatus(conversationId);
            console.log(cachedStatus)
            // Cache'de yoksa veritabanından al ve cache'e kaydet
            if (!cachedStatus) {
                const dbStatus = await conversationDatabaseModule.getMultiUserReadStatus([conversationId]);
                console.log(dbStatus)
                if (dbStatus && dbStatus.length > 0) {
                    await conversationReadCacheModule.setConversationReadStatus(conversationId, dbStatus);
                    return dbStatus;
                }
                return [];
            }
            return cachedStatus;
        });

        const allReadStatuses = await Promise.all(readStatusPromises);
        const flattenedReadStatuses = allReadStatuses.flat();

        // 6. Okuma durumlarını konuşmalara yerleştir
        const conversationsWithReadStatus = conversationData.map(conversation => {
            const conversationId = conversation._id?.toString();

            // Bu konuşmaya ait tüm read status kayıtlarını filtrele
            const conversationReadStatuses = flattenedReadStatuses.filter(
                status => status?.conversationId?.toString() === conversationId
            );

            // userId + conversationId birleşimiyle unique kayıtları al
            const userReadMap = new Map();

            for (const status of conversationReadStatuses) {
                const key = status.userId.toString();
                userReadMap.set(key, status);
            }

            // Güncel kullanıcının okuma durumu
            const currentUserStatus = userReadMap.get(userId.toString());
            const isRead =
                currentUserStatus?.lastReadMessage?.toString() ===
                conversation?.lastMessage?._id?.toString();

            // Diğer kullanıcıların okuma durumları
            const otherUsersReadStatus = {};
            for (const [uid, status] of userReadMap.entries()) {
                if (uid !== userId.toString()) {
                    const hasRead =
                        status.lastReadMessage?.toString() ===
                        conversation?.lastMessage?._id?.toString();
                    otherUsersReadStatus[uid] = hasRead;
                }
            }

            return {
                ...conversation,
                isRead: !!isRead,
                otherUsersReadStatus
            };
        });

        return res.status(200).json(
            ApiResponse.success("Sohbetler getirildi", conversationsWithReadStatus)
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            ApiResponse.serverError("Sunucu hatası", error)
        );
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
        const conversation = await conversationCacheModule.getCachedConversation(conversationId, conversationDatabaseModule.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        const updatedConversation = await conversationDatabaseModule.addParticipant(conversationId, userId);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Kullanici sohbete eklendi", updatedConversation))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
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
        const conversation = await conversationCacheModule.getCachedConversation(conversationId, conversationDatabaseModule.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        const updatedConversation = await conversationDatabaseModule.removeParticipant(conversationId, userId);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Kullanici sohbetten cikarildi", updatedConversation))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

/**
 * Delete a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Get the conversation to check if the current user is a participant
        const conversation = await conversationCacheModule.getCachedConversation(conversationId, conversationDatabaseModule.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        const deletedConversation = await conversationDatabaseModule.deleteConversation(conversationId, req.user.id);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet silindi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};