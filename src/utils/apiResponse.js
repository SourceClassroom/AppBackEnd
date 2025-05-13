//Standart API yanıt formatlarını sağlayan yardımcı fonksiyonlar


class ApiResponse {
    //Başarılı API yanıtı
    static success(message, data = null, statusCode = 200) {
        return {
            success: true,
            message,
            data,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Hata API yanıtı
     * @param {string} message - Hata mesajı
     * @param {any} errors - Hata detayları (opsiyonel)
     * @param {number} statusCode - HTTP durum kodu (varsayılan: 400)
     */
    static error(message, errors = null, statusCode = 400) {
        return {
            success: false,
            message,
            errors,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Sayfalandırılmış veri için API yanıtı
     * @param {string} message - Başarı mesajı
     * @param {Array} data - Sayfalandırılmış veri dizisi
     * @param {number} page - Mevcut sayfa numarası
     * @param {number} limit - Sayfa başına öğe sayısı
     * @param {number} totalDocs - Toplam belge sayısı
     * @param {number} totalPages - Toplam sayfa sayısı
     */
    static paginated(message, data, { page, limit, totalDocs, totalPages }) {
        return {
            success: true,
            message,
            data,
            pagination: {
                page,
                limit,
                totalDocs,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            statusCode: 200,
            timestamp: new Date().toISOString()
        };
    }

    //Yanıt olmayan (204 No Content) API yanıtı
    static noContent() {
        return {
            success: true,
            statusCode: 204,
            timestamp: new Date().toISOString()
        };
    }

    //Yetkilendirme hatası yanıtı
    static unauthorized(message = "Yetkilendirme başarısız") {
        return ApiResponse.error(message, null, 401);
    }

    //Erişim reddi hatası yanıtı
    static forbidden(message = "Bu işlem için yetkiniz yok", errors = null) {
        return ApiResponse.error(message, errors, 403);
    }

    //Bulunamadı hatası yanıtı
    static notFound(message = "Kaynak bulunamadı") {
        return ApiResponse.error(message, null, 404);
    }

    //Sunucu hatası yanıtı
    static serverError(message = "Sunucu hatası", error = null) {
        return ApiResponse.error(message, error, 500);
    }

     static rateLimit(message = "Çok fazla istek") {
        return ApiResponse.error(message, null, 429);
    }
}

export default ApiResponse;