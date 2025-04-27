export const returnUserPrefs = (userPrefs, notificationType) => {
    return {
        allowThisNotification: userPrefs[notificationType],
        allowEmail: userPrefs.email_notifications,
        allowPush: userPrefs.push_notifications
    }
}