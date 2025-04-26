export const returnUserPrefs = (userPrefs, notificationType) => {
    return {
        allowThisNotification: prefs[notificationType] === true,
        allowEmail: prefs.email_notifications === true,
        allowPush: prefs.push_notifications === true
    }
}