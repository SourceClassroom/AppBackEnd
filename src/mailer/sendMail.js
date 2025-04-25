import mailTransporter from "./mailTransporter.js";

export default async (userMail, subject, message) => {
    try {
        await mailTransporter.sendMail({
            from: process.env.MAIL_USER,
            to: userMail,
            subject: subject,
            text: message,
        });
    } catch (error) {
        console.error(error)
        throw error
    }
}