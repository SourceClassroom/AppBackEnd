import jwt from "jsonwebtoken";
import {User} from "../database/models/userModel.js";

/*
 * Token servis sınıfı
 * JWT token oluşturma ve doğrulama işlemleri
 */
class TokenService {
    /**
     * Kullanıcı için JWT erişim token'ı oluşturur
     *
     * @param {Object} user - Kullanıcı bilgileri
     * @param {String} user.id - Kullanıcı ID'si
     * @param {String} user.role - Kullanıcı rolü
     * @param {Number} user.tokenVersion - Kullanici jwt versiyonu
     * @returns {Promise<String>} Oluşturulan JWT token
     */
    static generateAccessToken(user) {
        return new Promise((resolve, reject) => {
            const payload = {
                id: user.id,
                role: user.role,
                version: user.tokenVersion
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '1d' },
                (err, token) => {
                    if (err) {
                        console.error('Token oluşturma hatası:', err);
                        return reject(err);
                    }
                    resolve(token);
                }
            );
        });
    }

    /**
     * JWT token doğrulama
     *
     * @param {String} token - Doğrulanacak token
     * @returns {Promise<Object>} Decode edilmiş token içeriği
     */
    static async verifyToken(token) {
        return new Promise(async (resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    console.error('Token doğrulama hatası:', err);
                    return reject(err);
                }

                try {
                    // Kullanıcıyı bul
                    const user = await User.findById(decoded.id);

                    if (!user) {
                        return reject(new Error('Kullanıcı bulunamadı'));
                    }

                    // Token sürüm kontrolü
                    // Eğer token'daki sürüm, kullanıcının mevcut sürümünden küçükse token geçersizdir
                    if (decoded.version !== undefined && user.tokenVersion !== undefined &&
                        decoded.version < user.tokenVersion) {
                        return reject(new Error('Token geçersiz: Şifre değiştirilmiş veya çıkış yapılmış'));
                    }

                    resolve(decoded);
                } catch (error) {
                    console.error('Token doğrulama sırasında veritabanı hatası:', error);
                    reject(error);
                }
            });
        });
    }

}

export default TokenService;