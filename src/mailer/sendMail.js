import fs from "fs/promises";
import path from "path";
import mailTransporter from "./mailTransporter.js";

/**
 * Mail gönderme fonksiyonu
 *
 * @param {string} userMail - Alıcının mail adresi
 * @param {string} subject - Mailin konusu
 * @param {Object} templateData - HTML'deki dinamik alanlar (örneğin: { name, code, ... })
 * @param {string} templateName - Kullandığın HTML şablon dosyasının adı (örnek: "email-verification.html")
 */
export default async (userMail, subject, templateData = {}, templateName = "announcement.html") => {
    try {
        // Şablon dosyasının yolunu belirle
        const templatePath = path.resolve("src/mailer/templates", templateName);

        // HTML şablonunu oku
        let htmlContent = await fs.readFile(templatePath, "utf-8");

        // Dinamik alanları {{placeholder}} şeklinde değiştir
        htmlContent = htmlContent.replace(/{{(\w+)}}/g, (_, key) => {
            return templateData[key] || "";
        });

        // Mail gönder
        await mailTransporter.sendMail({
            from: process.env.MAIL_USER,
            to: userMail,
            subject: subject,
            html: htmlContent,
        });
    } catch (error) {
        console.error("Mail gönderim hatası:", error);
        throw error;
    }
};
