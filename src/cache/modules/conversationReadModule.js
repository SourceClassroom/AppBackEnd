import { client } from "../client/redisClient.js";
import setWithTtl from "../strategies/setWithTtl.js";

const CACHE_PREFIX = 'readStatus:';
const CACHE_EXPIRE = 60 * 60 * 24; // 24 saat

// Konuşma için tüm okuma durumlarını cache'e kaydet
export const setConversationReadStatus = async (conversationId, readStatuses) => {
    const key = `${CACHE_PREFIX}${conversationId}`;
    await setWithTtl(key, JSON.stringify(readStatuses), CACHE_EXPIRE);
};

// Cache'den okuma durumlarını getir
export const getConversationReadStatus = async (conversationId) => {
    const key = `${CACHE_PREFIX}${conversationId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
};

// Yeni okuma durumu ekle/güncelle
export const updateReadStatus = async (conversationId, readStatus) => {
    const key = `${CACHE_PREFIX}${conversationId}`;
    const existingData = await getConversationReadStatus(conversationId) || [];

    // Mevcut kullanıcının durumunu güncelle veya yeni ekle
    const updatedStatuses = existingData.filter(
        status => status.userId.toString() !== readStatus.userId.toString()
    );
    updatedStatuses.push(readStatus);

    await setConversationReadStatus(conversationId, updatedStatuses);
    return updatedStatuses;
};