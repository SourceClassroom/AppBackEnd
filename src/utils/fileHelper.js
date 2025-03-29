import fs from "fs";
import path from "path";
import ApiResponse from "../utils/ApiResponse.js";

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

    res.contentType(mimeType);
    const fileStream = fs.createReadStream(filePath);

    fileStream.pipe(res);

    fileStream.on("error", (err) => {
        res.status(500).json(ApiResponse.serverError("Dosya görüntülenirken bir hata meydana geldi.", err));
    });
};
