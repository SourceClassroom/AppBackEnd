import fs from "fs";
import ApiResponse from "../utils/apiResponse.js";

/**
 * Belirtilen dosya yolunu HTTP yanıtına akış olarak gönderir.
 * @param {Object} res Express yanıt nesnesi
 * @param {String} filePath Dosyanın tam yolu
 * @param {String} mimeType İçerik türü (MIME type)
 */
export const streamFile = (res, filePath, mimeType) => {
    if (!fs.existsSync(filePath)) {
        return res.status(404).json(ApiResponse.notFound("Dosya sistemde bulunamadı."));
    }

    const origin = '*';

    res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + origin);
    res.setHeader('Content-Security-Policy', `frame-ancestors ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.contentType(mimeType);
    const fileStream = fs.createReadStream(filePath);

    fileStream.pipe(res);

    fileStream.on("error", (err) => {
        res.status(500).json(ApiResponse.serverError("Dosya görüntülenirken bir hata meydana geldi.", err));
    });
};
