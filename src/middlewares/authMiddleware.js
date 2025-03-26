import ApiResponse from "../utils/apiResponse.js";
import {User} from "../database/models/userModel.js";
import TokenService from "../services/jwtService.js";


/**
 * JWT token doğrulama middleware'i
 * Token'ı cookie veya Authorization header'dan alır
 * @param {Object} req - Express request objesi
 * @param {Object} res - Express response objesi
 * @param {Function} next - Express next fonksiyonu
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Token'ı birden fazla kaynaktan alma (cookie, header veya query string)
        const token =
            req.cookies?.jsonwebtoken ||
            req.headers?.authorization?.split(" ")[1] ||
            req.query?.token;

        if (!token) {
            return res.status(401).send(
                ApiResponse.unauthorized("Giriş yapmanız gerekiyor, login sayfasına yönlendiriliyor.")
            );
        }

        // Token'ı doğrula
        const decoded = await TokenService.verifyToken(token);

        if (!decoded) {
            return res.status(401).send(
                ApiResponse.unauthorized("Geçersiz veya süresi dolmuş token, lütfen tekrar giriş yapın.")
            );
        }

        // Veritabanından kullanıcıyı kontrol et
        // Bu adım isteğe bağlıdır ama güvenliği artırır (kullanıcı hala mevcut mu, aktif mi, vb.)
        const currentUser = await User.findById(decoded.id).select('-password');

        if (!currentUser) {
            return res.status(401).send(
                ApiResponse.unauthorized("Bu token ile ilişkili kullanıcı bulunamadı.")
            );
        }

        //Kullanıcı şifre değiştirdiyse token'ı geçersiz kılma
        /* Token id eklenmesi ile bu özellik kaldırıldı
        if (currentUser.passwordChangedAt &&
            parseInt(currentUser.passwordChangedAt.getTime() / 1000) > decoded.iat) {
            return res.status(401).send(
                ApiResponse.unauthorized("Şifreniz değiştirildi, lütfen tekrar giriş yapın.")
            );
        }
        */
        // Kullanıcıyı request objesine ekle
        req.user = currentUser;

        next();
    } catch (err) {
        //console.log('Auth middleware error:', err);

        // Token süresi dolmuşsa veya geçersizse özel hata mesajı
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send(
                ApiResponse.unauthorized("Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.")
            );
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).send(
                ApiResponse.unauthorized("Geçersiz token, lütfen tekrar giriş yapın.")
            );
        }

        // Genel hata
        return res.status(401).send(
            ApiResponse.unauthorized("Kimlik doğrulama başarısız, lütfen tekrar giriş yapın.")
        );
    }
};

export {
    authenticateToken
}