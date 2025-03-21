import jwt from "jsonwebtoken";

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
     * @returns {Promise<String>} Oluşturulan JWT token
     */
    static generateAccessToken(user) {
        return new Promise((resolve, reject) => {
            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
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
    static verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.error('Token doğrulama hatası:', err);
                    return reject(err);
                }
                resolve(decoded);
            });
        });
    }

}

export default TokenService;