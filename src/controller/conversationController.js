import ApiResponse from "../utils/apiResponse.js";
import {processMedia} from "../services/fileService.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey, invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Handlers
import * as userCacheHandler from "../cache/handlers/userCacheHandler.js";
import * as conversationCacheHandler from "../cache/handlers/conversationCacheHandler.js";
import * as userBlockCacheHandler from "../cache/handlers/userBlockCacheHandler.js";
import * as conversationReadCacheHandler from "../cache/handlers/conversationReadCacheHandler.js";

//Database Repositories
import * as userDatabaseRepository from "../database/repositories/userRepository.js";
import * as userBlockDatabaseRepository from "../database/repositories/userBlockRepository.js";
import * as conversationDatabaseRepository from "../database/repositories/conversationRepository.js";
import * as conversationReadDatabaseRepository from "../database/repositories/conversationReadRepository.js";

/**
 * Create a new conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createConversation = async (req, res) => {
    try {
        let isPending = false;
        const creatorId = req.user.id;
        const { participants, isGroup, groupName } = req.body;
        if (!Array.isArray(participants) || participants.length === 0) {
            throw new Error("At least one participant is required");
        }

        const allParticipants = [
            ...new Set([creatorId.toString(), ...participants.map(p => p.toString())])
        ];

        const blockStatuses = await Promise.all(
            allParticipants.map(async participantId => {
                if (participantId === creatorId.toString()) return false;
                return await userBlockCacheHandler.isBlockedBetween(creatorId, participantId, userBlockDatabaseRepository.isBlockBetWeen);
            })
        );

        if (blockStatuses.includes(true)) {
            return res.status(403).json(ApiResponse.forbidden("Engellenen veya sizi engelleyen kullanıcılarla konuşma başlatamazsınız", null));
        }

        if (!isGroup) {
            if (allParticipants.length !== 2) {
                return res.status(400).json(ApiResponse.error("Sohbet olusturulurken 1 kisi secilmeli", null));
            }
            const participant = await userCacheHandler.getCachedUserData(participants[0], userDatabaseRepository.getUserById);
            if (req.user.role === "student" && (participant.role === 'teacher' || participant.role === 'sysadmin')) {
                isPending = true;
            }

            const existing = await conversationDatabaseRepository.findPrivateConversation(allParticipants)

            if (existing) return res.status(400).json(ApiResponse.error("Bu konuşma zaten var", existing));
        } else {
            if (!groupName) {
                return res.status(400).json(ApiResponse.error("Grup ismi gereklidir", null));
            }

            if (req.user.role === "student") {
                const participantUsers = await multiGet(
                    participants,
                    "user",
                    userDatabaseRepository.getMultiUserById
                )
                if (participantUsers.some(p => p.role === 'teacher' || p.role === 'sysadmin')) {
                    return res.status(403).json(ApiResponse.forbidden("Öğrenciler öğretmen veya yöneticilerle grup oluşturamazlar", null));
                }
            }
        }
        const conversation = await conversationDatabaseRepository.createConversation(
            allParticipants,
            isGroup,
            groupName,
            creatorId,
            isPending
        );

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
        const conversations = await conversationCacheHandler.getUserConversations(
            userId,
            conversationDatabaseRepository.getUserConversations
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
            conversationDatabaseRepository.getMultiConversations
        );

        // 3. Her konuşma için katılımcıların bilgilerini al
        const participantsData = await Promise.all(
            conversationData.map(conversation =>
                multiGet(
                    conversation.participants,
                    "user",
                    userDatabaseRepository.getMultiUserById
                )
            )
        );

        // 4. Katılımcı bilgilerini konuşmalara ekle + mute bilgisi + block kontrolü
        const updatedConversations = await Promise.all(
            conversationData.map(async (conversation, index) => {
                const participants = participantsData[index].map(user => ({
                    _id: user._id,
                    name: user.name,
                    surname: user.surname,
                    profile: {
                        avatar: user?.profile?.avatar
                    },
                }));

                const isMuted = conversation.mutedBy.includes(userId);

                let isBlocked = false;
                let isUserBlock = false;

                if (!conversation.isGroup) {
                    const otherUser = participants.find(p => p._id.toString() !== userId.toString());
                    if (otherUser) {
                        isBlocked = await userBlockCacheHandler.hasUserBlocked(otherUser._id, userId, userBlockDatabaseRepository.getBlockData)
                        isUserBlock = await userBlockCacheHandler.hasUserBlocked(userId, otherUser._id, userBlockDatabaseRepository.getBlockData)
                    }
                }

                return {
                    ...conversation,
                    participants,
                    isMuted,
                    isBlocked,
                    isUserBlock
                };
            })
        );

        // 5. Tüm konuşmalardaki tüm kullanıcıların okuma durumlarını getir
        const readStatuses = await Promise.all(
            updatedConversations.map(conversation =>
                conversationReadCacheHandler.getCachedReadStatus(
                    conversation._id.toString(),
                    conversationReadDatabaseRepository.getReadStatus
                )
            )
        );

        // 6. Okundu bilgisi hesapla
        updatedConversations.forEach((conversation, index) => {
            const readStatusList = readStatuses[index];
            const userReadStatus = readStatusList.find(
                rs => rs.userId.toString() === userId.toString()
            );
            const otherReadStatuses = readStatusList.filter(
                rs => rs.userId.toString() !== userId.toString()
            ).map(rs => ({
                userId: rs.userId,
                lastReadMessage: rs.lastReadMessage,
                updatedAt: rs.updatedAt
            }));

            if (userReadStatus && conversation.lastMessage?._id) {
                conversation.isRead =
                    userReadStatus.lastReadMessage?.toString() === conversation.lastMessage._id.toString();
            } else {
                conversation.isRead = false;
            }

            conversation.otherReadStatuses = otherReadStatuses;
        });

        return res.status(200).json(
            ApiResponse.success("Sohbetler getirildi", updatedConversations)
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
        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)

        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }

        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))
        if (conversation.participants.includes(userId)) return res.status(400).json(ApiResponse.error("Kullanıcı zaten bu guruba ekle"))

        // Check block status between participants
        const blockStatus = await userBlockCacheHandler.isBlockedBetween(userId, req.user.id, userBlockDatabaseRepository.isBlockBetWeen)

        if (blockStatus) {
            return res.status(403).json(ApiResponse.forbidden("Engellenen veya sizi engelleyen kullanıcıları ekleyemezsiniz", null));
        }

        const updatedConversation = await conversationDatabaseRepository.addParticipant(conversationId, userId);
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
        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        await conversationDatabaseRepository.removeParticipant(conversationId, userId);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Kullanici sohbetten cikarildi", {success: true}))
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
        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        await conversationDatabaseRepository.deleteConversation(conversationId, req.user.id);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet silindi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

export const changeGroupImage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        req.body.permission = 0

        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (!conversation.isGroup) return res.status(403).json(ApiResponse.forbidden("Özel mesajlarda resim değiştirilemez.", null))
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        const fileIds = await processMedia(req)

        await conversationDatabaseRepository.changeGroupImage(conversationId, fileIds[0]);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet guncellendi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

export const leaveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (!conversation.isGroup) return res.status(403).json(ApiResponse.forbidden("Özel mesajlardan çıkamazsın.", null))

        await conversationDatabaseRepository.removeParticipant(conversationId, req.user.id);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbetten cikildi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

export const muteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (conversation.mutedBy.includes(req.user.id)) return res.status(400).json(ApiResponse.error("Zaten bu sohbeti susturmuşsın."))

        await conversationDatabaseRepository.muteConversation(conversationId, req.user.id);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet kapatildi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

export const unmuteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (!conversation.mutedBy.includes(req.user.id)) return res.status(400).json(ApiResponse.error("Zaten bu sohbeti susturmamışsın."))

        await conversationDatabaseRepository.unmuteConversation(conversationId, req.user.id);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet acildi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
};

export const approveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (!conversation.participants.includes(req.user.id)) return res.status(403).json(ApiResponse.forbidden("Bu sohbetin bir üyesi değilsiniz.", null))
        if (req.user.role === "student") return res.status(403).json(ApiResponse.forbidden("Yetkiniz yok", null))
        if (!conversation.isPending) return res.status(400).json(ApiResponse.error("Zaten bu sohbeti onaylamamışsın."))

        await conversationDatabaseRepository.approveConversation(conversationId);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet onaylandi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
}

export const changeGroupName = async (req, res) => {
    try {
        const { groupName, conversationId } = req.body;

        const conversation = await conversationCacheHandler.getCachedConversation(conversationId, conversationDatabaseRepository.getConversationById)
        if (!conversation) {
            return res.status(404).json(ApiResponse.notFound("Sohbet bunulamadi"))
        }
        if (!conversation.isGroup) return res.status(403).json(ApiResponse.forbidden("Özel mesajlarda isim değiştirilemez.", null))
        if (conversation.isGroup && conversation.groupOwner.toString() !== req.user.id) return res.status(403).json(ApiResponse.forbidden("Sohbeti duzenleme yetkiniz yok", null))

        await conversationDatabaseRepository.changeGroupName(conversationId, groupName);
        await invalidateKey(`conversation:${conversationId}`)

        return res.status(200).json(ApiResponse.success("Sohbet guncellendi", {success: true}))
    } catch (error) {
        console.error(error);
        return res.status(500).json(ApiResponse.serverError("Sunucu hatası", error))
    }
}