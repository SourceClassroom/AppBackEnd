import {User} from '../database/models/userModel.js';
import {Notification} from '../database/models/notificationModel.js';
import {Class} from "../database/models/classModel.js";

/**
 * Farklı bildirim türleri
 */
const NOTIFICATION_TYPES = {
    NEW_ASSIGNMENT: 'new_assignment',
    ASSIGNMENT_GRADED: 'assignment_graded',
    NEW_ANNOUNCEMENT: 'new_announcement',
    NEW_MATERIAL: 'new_material',
    NEW_COMMENT: 'new_comment',
    CLASS_INVITE: 'class_invite',
    ASSIGNMENT_DUE_REMINDER: 'assignment_due_reminder',
    SUBMISSION_REMINDER: 'submission_reminder'
};


/**
 * Kullanıcı bildirim tercihlerini kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @param {string} notificationType - Bildirim türü
 * @returns {Promise<boolean>} - Kullanıcının bu tür bildirim almak isteyip istemediği
 */
async function checkUserPreferences(userId, notificationType) {
    try {
        const user = await User.findById(userId);

        if (!user) {
            console.error(`Kullanıcı bulunamadı: ${userId}`);
            return false;
        }

        // Kullanıcının bildirim ayarlarını kontrol et
        // Varsayılan olarak tüm bildirimleri etkinleştir
        if (!user.notificationPreferences) {
            return true;
        }

        return user.notificationPreferences[notificationType] !== false;
    } catch (error) {
        console.error(`Bildirim tercihleri kontrol edilirken hata oluştu: ${error.message}`);
        return false;
    }
}

/**
 * Uygulama içi bildirim oluşturur ve veritabanına kaydeder
 * @param {string} userId - Alıcı kullanıcı ID
 * @param {string} type - Bildirim türü
 * @param {string} title - Bildirim başlığı
 * @param {string} message - Bildirim mesajı
 * @param {Object} classId - Sinif idsi
 * @returns {Promise<Object>} - Oluşturulan bildirim nesnesi
 */
async function createInAppNotification(userId, type, title, message, classId) {
    try {
        // Kullanıcının bu tür bildirim almak isteyip istemediğini kontrol et
        const shouldNotify = await checkUserPreferences(userId, type);

        if (!shouldNotify) {
            console.info(`Kullanıcı ${userId} ${type} türü bildirimleri devre dışı bırakmış.`);
            return null;
        }

        const notification = new Notification({
            user: userId,
            type,
            title,
            message,
            classroom: classId,
            isRead: false
        });

        await notification.save();
        console.info(`Bildirim oluşturuldu: ${userId} için ${type}`);

        // Gerçek zamanlı bildirim için burada socket.io kullanılabilir
        // Örnek: io.to(userId).emit('new_notification', notification);

        return notification;
    } catch (error) {
        console.error(`Bildirim oluşturulurken hata: ${error.message}`);
        throw error;
    }
}

/**
 * Sınıftaki tüm öğrencilere bildirim gönderir
 * @param {string} classId - Sınıf ID
 * @param {string} type - Bildirim türü
 * @param {string} title - Bildirim başlığı
 * @param {string} message - Bildirim mesajı
 * @returns {Promise<*[]>} - Oluşturulan bildirimlerin listesi
 */
async function notifyClassMembers(classId, type, title, message) {
    try {
        // Sınıftaki tüm öğrencileri bul
        const classData = await Class.findById(classId)
        if (!classData) {
            return []
        }
        const users = classData.students
        const notifications = [];

        // Her öğrenciye bildirim gönder
        for (const user of users) {
            // Uygulama içi bildirim oluştur
            const notification = await createInAppNotification(
                user._id,
                type,
                title,
                message,
                classId
            );

            if (notification) {
                notifications.push(notification);
            }
        }

        return notifications;
    } catch (error) {
        console.error(`Sınıf üyelerine bildirim gönderilirken hata: ${error.message}`);
        throw error;
    }
}


export {checkUserPreferences, createInAppNotification, notifyClassMembers};