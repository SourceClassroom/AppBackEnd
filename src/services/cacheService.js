import {client} from "../redis/redisClient.js";
import {User} from "../database/models/userModel.js";
import {Class} from "../database/models/classModel.js";
import {Attachment} from "../database/models/attachmentModel.js";
import {Submission} from "../database/models/submissionsModel.js";


export const writeToCache = async (key, value, ttl) => {
    try {
        const valueJson = JSON.stringify(value)

        return await client.setEx(key, ttl, valueJson)
    } catch (error) {
        return error
    }
}

export const getFromCache = async (key) => {
    try {
        return JSON.parse(await client.get(key))
    } catch (error) {
        return error
    }
}

export const removeFromCache = async (key) => {
    try {
        return await client.del(key)
    } catch (error) {
        return error
    }
}

export const getUserFromCacheOrCheckDb = async (userId) => {
    try {
        const cacheKey = `user:${userId}`

        const cachedData = await getFromCache(cacheKey)
        if (cachedData) {
            return cachedData
        }

        const user = await User.findById(userId, {password: false})
        if (!user) return;

        //await client.setEx(`user:${userId}`, 3600,  JSON.stringify(user))
        await writeToCache(cacheKey, user, 3600)

        return user
    } catch (error) {
        return error
    }
}

export const getDashboardFromCacheOrCheckDb = async (userId) => {
    try {
        const cacheKey = `user:${userId}:dashboard`

        const cachedData = await getFromCache(cacheKey)
        if (cachedData) {
            return cachedData
        }

        const user = await User.findById(userId, "name surname email role")
            .populate({
                path: "enrolledClasses",
                select: "title description"
            })
            .populate({
                path: "teachingClasses",
                select: "title description code"
            })

        if (!user) return;

        //await client.setEx(`user:${userId}`, 3600,  JSON.stringify(user))
        await writeToCache(cacheKey, user, 3600)

        return user
    } catch (error) {
        return error
    }
}

export const getASubmissionFromCacheOrCheckDb = async (submissionId) => {
    try {
        const cacheKey = `submission:${submissionId}`

        const cachedData = await getFromCache(cacheKey)
        if (cachedData) {
            return cachedData
        }

        const submission = await Submission.findById(submissionId)
            .populate({
                path: 'student',
                select: 'name surname avatar',
            }).populate({
                path: 'attachments',
                select: 'originamName mimetype size',
            })
        if (!submission) return;

        await writeToCache(cacheKey, submission, 3600)

        return submission
    } catch (error) {
        return error
    }
}

export const getAttachmentFromCacheOrCheckDb = async (attachmentId) => {
    try {
        const cacheKey = `attachment:${attachmentId}`

        const cachedData = await getFromCache(cacheKey)
        if (cachedData) {
            return cachedData
        }

        const attachment = await Attachment.findById(attachmentId)
        if (!attachment) return;

        await writeToCache(cacheKey, attachment, 3600)

        return attachment
    } catch (error) {
        return error
    }
}

export const getClassFromCacheOrCheckDb = async (classId) => {
    try {
        const cacheKey = `class:${classId}`

        const cachedData = await getFromCache(cacheKey)
        if (cachedData) {
            return cachedData
        }

        const attachment = await Class.findById(classId, "title description")
            .populate({
                path: "teacher",
                select: "name surname email",
            })
            .populate({
                path: "weeks",
                select: "title description startDate endDate",
            })
            .populate({
                path: "assignments",
                select: "title description dueDate createdAt",
            })
        if (!attachment) return;

        await writeToCache(cacheKey, attachment, 3600)

        return attachment
    } catch (error) {
        return error
    }
}

export const clearClassCache = async (classId) => {
    try {
        const keysToDelete = [];
        const pattern = `class:${classId}:*`; // Pattern for caches to delete

        // Find all keys efficiently
        const scanAndDelete = async (cursor = 0) => {
            // Handle different Redis client implementations
            let nextCursor;
            let foundKeys;

            try {
                // For redis@4.x and newer
                const reply = await client.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100
                });
                nextCursor = reply.cursor;
                foundKeys = reply.keys;
            } catch (err) {
                // For older redis versions or ioredis
                const reply = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);

                // Handle different return formats
                if (Array.isArray(reply)) {
                    [nextCursor, foundKeys] = reply;
                } else if (reply && typeof reply === 'object') {
                    nextCursor = reply.cursor || 0;
                    foundKeys = reply.keys || [];
                }
            }

            if (foundKeys && foundKeys.length > 0) {
                keysToDelete.push(...foundKeys);
            }

            // Continue if there are more keys
            if (nextCursor && nextCursor !== 0 && nextCursor !== "0") {
                await scanAndDelete(nextCursor);
            }
        };

        await scanAndDelete();

        // Delete found keys
        if (keysToDelete.length > 0) {
            // Handle large key sets by chunking if needed
            if (keysToDelete.length > 100) {
                // Delete in chunks of 100
                for (let i = 0; i < keysToDelete.length; i += 100) {
                    const chunk = keysToDelete.slice(i, i + 100);
                    await client.del(chunk);
                }
            } else {
                await client.del(keysToDelete);
            }
        }

        return keysToDelete.length; // Return number of deleted keys
    } catch (err) {
        console.error("Cache clearing error:", err);
        throw err; // Rethrow to allow handling by caller
    }
};

export const clearUserCache = async (userId) => {
    try {
        const keysToDelete = [];
        const pattern = `user:${userId}:*`; // Pattern for user-related cache keys

        const scanAndDelete = async (cursor = 0) => {
            let nextCursor;
            let foundKeys;

            try {
                // Redis 4.x+ style
                const reply = await client.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100
                });
                nextCursor = reply.cursor;
                foundKeys = reply.keys;
            } catch (err) {
                // Fallback for older Redis or ioredis
                const reply = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);

                if (Array.isArray(reply)) {
                    [nextCursor, foundKeys] = reply;
                } else if (reply && typeof reply === 'object') {
                    nextCursor = reply.cursor || 0;
                    foundKeys = reply.keys || [];
                }
            }

            if (foundKeys && foundKeys.length > 0) {
                keysToDelete.push(...foundKeys);
            }

            if (nextCursor && nextCursor !== 0 && nextCursor !== "0") {
                await scanAndDelete(nextCursor);
            }
        };

        await scanAndDelete();

        if (keysToDelete.length > 0) {
            if (keysToDelete.length > 100) {
                for (let i = 0; i < keysToDelete.length; i += 100) {
                    const chunk = keysToDelete.slice(i, i + 100);
                    await client.del(chunk);
                }
            } else {
                await client.del(keysToDelete);
            }
        }

        return keysToDelete.length;
    } catch (err) {
        console.error("User cache clearing error:", err);
        throw err;
    }
};
