import { Worker } from "bullmq";
import sendMail from "../../mailer/sendMail.js";
import { client } from "../../cache/client/redisClient.js";

const mailWorker = new Worker("mailQueue", async job => {
    const { email, subject, message } = job.data;

    try {
        await sendMail(email, subject, message);
        console.log(`Mail sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send mail to ${email}:`, error.message);
        throw error;
    }
}, { connection: client });

mailWorker.on('completed', (job) => {
    console.log(`Job completed: ${job.id}`);
});

mailWorker.on('failed', (job, err) => {
    console.error(`Job failed: ${job.id}`, err.message);
});

export default mailWorker;