import { Worker } from "bullmq";
import sendMail from "../../mailer/sendMail.js";
import { client } from "../../cache/client/redisClient.js";

const mailWorker = new Worker("mailQueue", async job => {
    const { email, notificationData, name} = job.data;
    const { subject, message, actionText, path, classTitle} = notificationData

    try {
        await sendMail(
            email,
            subject,
            {
                name,
                course: classTitle,
                announcementTitle: subject,
                announcementBody: message,
                actionUrl: `${process.env.FRONTEND_URL}${path}`,
                actionText
            }
        );
        //await sendMail(email, subject, message);
        //console.log(`Mail sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send mail to ${email}:`, error.message);
        throw error;
    }
}, { connection: client });

mailWorker.on('completed', (job) => {
    console.log(`mailWorker completed: ${job.id}`);
});

mailWorker.on('failed', (job, err) => {
    console.error(`mailWorker failed: ${job.id}`, err.message);
});

export default mailWorker;