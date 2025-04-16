import jwt from "jsonwebtoken";
import {client} from "../cache/client/redisClient.js";

//Cache Modules
import *as tokenCacheModule from '../cache/modules/tokenModule.js';

//Database Modules
import *as userDatabaseModule from '../database/modules/userModule.js';

/*
 * Token servis sınıfı
 * JWT token oluşturma ve doğrulama işlemleri
 */
class TokenService {
    static blacklistToken = async (token) => {
        try {
            // Token'ı kara listeye ekleyip süresi dolana kadar Redis’te tut
            const decoded = await TokenService.verifyToken(token);
            const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

            if (expiresIn > 0) {
                await tokenCacheModule.blacklistToken(token, expiresIn)
            }

            return true
        } catch (error) {
            return error
        }
    };
    static generateVersionCode() {
        const max = 100000000000
        return Math.floor(Math.random() * max);
    }
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
                async (err, token) => {
                    if (err) {
                        console.error('Token oluşturma hatası:', err);
                        return reject(err);
                    }

                    try {
                        // Token’ı Redis’e ekle (expire süresini belirle)
                        const expireSeconds = process.env.JWT_EXPIRE
                            ? parseInt(process.env.JWT_EXPIRE) * 60 * 60 * 24 // 1 gün
                            : 86400; // 1 gün (varsayılan)

                        //await client.setEx(`token:${user.id}`, expireSeconds, token);

                        resolve(token);
                    } catch (redisErr) {
                        console.error("Redis'e token kaydedilirken hata oluştu:", redisErr);
                        reject(redisErr);
                    }
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
            try {
                // Token'ın kara listede olup olmadığını kontrol et
                const isBlacklisted = await client.get(`blacklistToken:${token}`);
                if (isBlacklisted) {
                    return reject(new Error("Token geçersiz: Çıkış yapılmış veya süresi dolmuş"));
                }

                // Token'ı doğrula
                jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                    if (err) {
                        //console.error("Token doğrulama hatası:", err);
                        return reject(err);
                    }

                    try {
                        // Kullanıcıyı bul
                        //const user = await User.findById(decoded.id);
                        const user = await userDatabaseModule.getUserById(decoded.id);

                        if (!user) {
                            return reject(new Error("Kullanıcı bulunamadı"));
                        }

                        // Token sürüm kontrolü (örneğin şifre değiştirildiyse token geçersiz olur)
                        if (
                            decoded.version !== undefined &&
                            user.tokenVersion !== undefined &&
                            decoded.version < user.tokenVersion
                        ) {
                            return reject(new Error("Token geçersiz: Şifre değiştirilmiş veya çıkış yapılmış"));
                        }

                        resolve(decoded);
                    } catch (error) {
                        reject(error);
                    }
                });
            } catch (redisError) {
                reject(redisError);
            }
        });
    }
}




export default TokenService;