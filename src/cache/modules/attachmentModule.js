import getOrSet from "../strategies/getOrSet.js";

const ATTACHMENT_KEY = (attachmentId) =>`attachment:${attachmentId}`;

export const getCachedAttachmentData = async (attachmentId, fetchFn) => {
    try {
        return await getOrSet(ATTACHMENT_KEY(attachmentId), () => fetchFn(attachmentId))
    } catch (error) {
        throw error;
    }
}