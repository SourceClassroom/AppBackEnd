import bcrypt from 'bcryptjs';
import * as crypto from "node:crypto";
import ApiResponse from "../utils/apiResponse.js";
import TokenService from "../services/jwtService.js";
import * as fileService from "../services/fileService.js";
import { generateCode } from "../services/randomCodeService.js";

//Mailer
import sendMail from "../mailer/sendMail.js";

//Cache Strategies
import multiGet from "../cache/strategies/multiGet.js";
import {invalidateKey, invalidateKeys} from "../cache/strategies/invalidate.js";

//Cache Handlers
import * as userCacheHandler from "../cache/handlers/userCacheHandler.js";
import * as userBlockCacheHandler from "../cache/handlers/userBlockCacheHandler.js";
import * as onlineUserCacheHandler from "../cache/handlers/onlineUserCacheHandler.js";
import * as mailVerificationCacheHandler from "../cache/handlers/mailVerificationCacheHandler.js";

//Database Repositories
import * as userDatabaseRepository from "../database/repositories/userRepository.js";
import * as classDatabaseRepository from "../database/repositories/classRepository.js";
import * as userBlockDatabaseRepository from "../database/repositories/userBlockRepository.js";

/**
 * Kullanıcı bilgisi alma
 * @route GET /api/users/:id
 * @access Public
 * */
export const getUserProfile = async (req, res) => {
    try {
        const reqUser = req.user.id
        const userId = req.params.id;
        const userData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)

        if (!userData) {
            return res.status(404).jsonp(ApiResponse.notFound("Bu id ile bir kullanic bulunamadi"))
        }

        const isUserBlock = await userBlockCacheHandler.hasUserBlocked(reqUser, userId, userBlockDatabaseRepository.getBlockData)
        const isBlocked = await userBlockCacheHandler.hasUserBlocked(userId, reqUser, userBlockDatabaseRepository.getBlockData)
        const sockets = await onlineUserCacheHandler.getUserSockets(userId);
        const isUserOnline = sockets.length > 0;

        const formattedData = {
            profile: userData.profile,
            name: userData.name,
            surname: userData.surname,
            role: userData.role,
            lastLogin: userData.lastLogin,
            isUserOnline,
            isBlocked,
            isUserBlock
        };

        return res.status(200).json(ApiResponse.success("Kullanıcı bilgisi.", formattedData, 200));
    } catch (error) {
        return res.status(500).json(ApiResponse.serverError("Kullanıcı bilgisi alınırken hata meydana geldi.", error));
    }
}

/**
 * Yeni kullanıcı oluşturma
 * @route POST /api/users/register
 * @access Public
 */
export const createUser = async (req, res) => {
    try {
        // Request body'den verileri al
        const { name, surname, email, password, role } = req.body;
        if (role === "sysadmin") return res.status(403).json(ApiResponse.forbidden("Bu rol kullanılamaz."))
        // Check if first user
        const existingUsers = await userCacheHandler.getUserCount(userDatabaseRepository.getUserCount);

        const isFirstUser = existingUsers === 0;

        // E-posta kontrolü
        const existingUser = await userDatabaseRepository.getUserByEmail(email)
        if (existingUser) {
            return res.status(400).json(
                ApiResponse.error('Bu e-posta adresi zaten kullanılıyor')
            );
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // First user is sysadmin, otherwise use provided role
        const userRole = isFirstUser ? 'sysadmin' : (role || 'student');
        const accountStatus = userRole === "teacher" ? 'pending' : userRole === "sysadmin" ? 'active' : 'mailVerification';

        // Yeni kullanıcı oluştur
        const newUserData = {
            name,
            surname,
            email,
            password: hashedPassword,
            role: userRole,
            accountStatus,
            mailVerification: false,
            tokenVersion: TokenService.generateVersionCode()
        }

        const newUser = await userDatabaseRepository.createUser(newUserData)
        if (userRole === "student") {
            const code = generateCode()
            await mailVerificationCacheHandler.setVerificationCode(email, code)
            await sendMail(
                email,
                `${process.env.APP_NAME} Mail Doğrulama`,
                {
                    name: `${name} ${surname}`,
                    verificationCode: code
                },
                "email-verification.html"
            )
        }


        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            surname: newUser.surname,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
            accountStatus
        };

        res.status(200).json(
            ApiResponse.success(
                'Giriş başarılı',
                {
                    user: userResponse
                }
            )
        );

    } catch (error) {
        console.error('Kullanıcı oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Kullanıcı oluşturulurken bir hata oluştu', error)
        );
    }
}

/**
 * Kullanıcı girişi
 * @route POST /api/users/login
 * @access Public
 */
export const loginUser = async (req, res) => {
    try {
        // Request body'den verileri al
        const { email, password } = req.body;

        // Kullanıcıyı bul
        const user = await userDatabaseRepository.getUserLoginData(email)
        if (!user) {
            return res.status(401).json(
                ApiResponse.error('Geçersiz kimlik bilgileri', null, 401)
            );
        }
        //Check user account status
        const {accountStatus} = user
        if (accountStatus === "pending") {
            return res.status(403).json(
                ApiResponse.forbidden('Bu kullanıcı hesabı henüz onaylanmamış.')
            );
        } else if (accountStatus === "inactive") {
            return res.status(403).json(
                ApiResponse.forbidden('Bu kullanıcı hesabı aktif değil lütfen bir sistem yöneticisine danışın.')
            );
        } else if (accountStatus === "suspended") {
            return res.status(403).json(
                ApiResponse.forbidden("Bu kullanıcı hesabı'nın giriş yapma izni bulunmuyor.")
            );
        } else if (accountStatus === "mailVerification") {
            return res.status(403).json(
                ApiResponse.forbidden("Lütfen mail adresinizi doğrulayın.", {verification: false})
            );
        }
        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json(
                ApiResponse.error('Geçersiz kimlik bilgileri', null, 401)
            );
        }

        // Token oluştur
        const token = await TokenService.generateAccessToken({
            id: user._id,
            role: user.role,
            tokenVersion: user.tokenVersion
        });

        // Hassas verileri kaldır
        const userResponse = {
            _id: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role
        };
        await userDatabaseRepository.updateLastLogin(user._id)

        // Başarılı yanıt
        res.status(200).json(
            ApiResponse.success(
                'Giriş başarılı',
                {
                    user: userResponse,
                    token,
                }
            )
        );
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Giriş yapılırken bir hata oluştu', error)
        );
    }
};

export const verifyMail = async (req, res) => {
    try {
        const { mail, code } = req.body

        const user = await userDatabaseRepository.getUserByEmail(mail)
        if (!user) return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."))
        if (user.mailVerification === true) return res.status(400).json(ApiResponse.error("Mail adresi zaten doğrulanmış."))

        const verificationCode = await mailVerificationCacheHandler.getVerificationCode(mail)

        if (!verificationCode) {
            return res.status(400).json(
                ApiResponse.error('Doğrulama kodunun süresi dolmuş.')
            )
        }

        if (!crypto.timingSafeEqual(Buffer.from(verificationCode), Buffer.from(code))) {
            return res.status(400).json(
                ApiResponse.error('Hatalı doğrulama kodu.')
            )
        }

        const newUserData = await userDatabaseRepository.verifyUser(mail)
        await userCacheHandler.clearUserCache(newUserData._id)
        await invalidateKeys([`code:${mail}`])

        res.status(200).json(
            ApiResponse.success('Mail doğrulandı.', newUserData._id)
        )
    } catch (error) {
        console.error(error)
        res.status(500).json(
            ApiResponse.serverError('Mail doğrulama hatası', error)
        )
    }
}

export const generateVerificationCode = async (req, res) => {
    try {
        const { mail } = req.body

        const user = await userDatabaseRepository.getUserByEmail(mail)
        if (!user) return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."))
        if (user.mailVerification === true) return res.status(400).json(ApiResponse.error("Mail adresi zaten doğrulanmış."))

        const code = generateCode()
        await invalidateKey(`code:${mail}`)
        await mailVerificationCacheHandler.setVerificationCode(mail, code)

        await sendMail(
            mail,
            `${process.env.APP_NAME} Mail Doğrulama`,
            {
                name: `${name} ${surname}`,
                verificationCode: code
            },
            "email-verification.html"
        )

        res.status(200).json(
            ApiResponse.success('Doğrulama kodu oluşturuldu.')
        )
    } catch (error) {
        console.error(error)
        res.status(500).json(
            ApiResponse.serverError('Doğrulama kodu oluşturulurken bir hata oluştu', error)
        )
    }
}

/**
 * Kullanıcı şifresini değiştirme
 * @route PUT /api/users/change-password
 * @access Private (Kimlik doğrulama gerekli)
 */
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email
        const { currentPassword, newPassword } = req.body;

        // Giriş kontrolü
        if (!currentPassword || !newPassword) {
            return res.status(400).json(
                ApiResponse.error('Mevcut şifre ve yeni şifre gereklidir')
            );
        }

        // Kullanıcıyı bul (şifre dahil)
        const user = await userDatabaseRepository.getUserLoginData(userEmail)
        if (!user) {
            return res.status(404).json(
                ApiResponse.error('Kullanıcı bulunamadı')
            );
        }

        // Mevcut şifreyi kontrol et
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json(
                ApiResponse.error('Mevcut şifre yanlış')
            );
        }
        if (await bcrypt.compare(newPassword, user.password)) { // import bcrypt
            return res.status(400).json(ApiResponse.error("Eski şifre ile yeni şifre aynı olamaz."))
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Token sürümünü artır (JWT'leri geçersiz kılmak için)
        const newTokenVersion = TokenService.generateVersionCode();

        // Kullanıcıyı güncelle
        await userDatabaseRepository.changePassword(userId, hashedPassword, newTokenVersion)

        // Yeni JWT token oluştur (yeni tokenVersion ile)
        const token = await TokenService.generateAccessToken({
            id: user.id,
            role: user.role,
            tokenVersion: newTokenVersion // Token'a sürüm ekle
        });

        const oldToken =
            req.cookies?.jsonwebtoken ||
            req.headers?.authorization?.split(" ")[1] ||
            req.query?.token;

        await TokenService.blacklistToken(oldToken)
        sendMail(
            userEmail,
            `${process.env.APP_NAME} şifreniz başarıyle değiştirildi.`,
            {
                name: `${user.name} ${user.surname}`,
            },
            "password-change.html"
        )
        res.status(200).json(
            ApiResponse.success(
                'Şifre başarıyla değiştirildi',
                {
                    success: true
                }
            )
        );

    } catch (error) {
        console.error('Şifre değiştirme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Şifre değiştirilirken bir hata oluştu', error)
        );
    }
};

export const changeEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;
        //const cacheKey = `user:${userId}`;

        if (!email) return res.status(400).json(ApiResponse.error("Email alanı zorunludur."))

        const findUser = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)
        if(findUser.email === email) return res.status(400).json(ApiResponse.error("Yeni mail eskisi ile aynı olamaz."))

        const updateUser = await userDatabaseRepository.changeEmail(userId, email)
        await userCacheHandler.clearUserCache(userId)

        return res.status(200).json(ApiResponse.success("Email adresi başarıyla değişti.", updateUser));
    } catch (error) {
        console.error('Email değiştirme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Email değiştirilirken bir hata oluştu', error)
        );
    }
}

export const logoutUser = async (req, res) => {
    try {
        const token =
            req.cookies?.jsonwebtoken ||
            req.headers?.authorization?.split(" ")[1] ||
            req.query?.token;

        if (!token) {
            return res.status(400).send(ApiResponse.badRequest("Token bulunamadı."));
        }

        await TokenService.blacklistToken(token)
        await onlineUserCacheHandler.removeAllUserSockets(req.user.id)

        return res.status(200).json(ApiResponse.success("Başarıyla çıkış yapıldı."))
    } catch (error) {
        console.log(error)
        res.status(500).json(
            ApiResponse.serverError('Çıkış yapılırken bir hata meydana geldi.', error)
        );
    }
}

export const changeAvatar = async (req, res) => {
    try {
        const userId = req.user.id
        req.body.permission = 0;

        if (req.files.length === 0 || !req.files) {
            return res.status(400).json(ApiResponse.error("En az 1 dosya yüklenmeli."));
        }
        const currentUserData = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)
        const fileIds = await fileService.processMedia(req)

        await userDatabaseRepository.changeAvatar(userId, fileIds[0])

        //await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`])
        await userCacheHandler.clearUserCache(userId)
        await fileService.deleteAttachment(currentUserData.profile?.avatar)

        return res.status(200).json(ApiResponse.success("Avatar başarılı bir şekilde değiştirildi."))
    } catch (error) {
        console.log(error)
        res.status(500).json(
            ApiResponse.serverError('Avatar değiştirilirken bir hata meydana geldi.', error)
        );
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, surname, profile } = req.body;
        const cacheKey = `user:${userId}`;

        const user = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)
        if (!user) {
            return res.status(404).json(ApiResponse.error("Kullanıcı bulunamadı."));
        }

        // Mevcut profil verisini koruyarak güncelle
        const updatedProfileData = {
            name: name ?? user.name,
            surname: surname ?? user.surname,
            profile: {
                avatar: user.profile?.avatar,
                bio: profile?.bio ?? user.profile.bio,
                institutionId: profile?.institutionId ?? user.profile.institutionId,
            }
        };

        await userDatabaseRepository.updateProfile(userId, updatedProfileData)
        await userCacheHandler.clearUserCache(userId)
        //await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`])

        return res.status(200).json(ApiResponse.success("Profil başarıyla güncellendi.", user));
    } catch (error) {
        console.error(error)
        res.status(500).json(
            ApiResponse.serverError("Profil güncellenirken bir hata meydana geldi.", error)
        );
    }
};

export const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationPreferences } = req.body;

        // Kullanıcıyı bul
        const user = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)
        if (!user) {
            return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."));
        }

        // Mevcut notificationPreferences'ı koruyarak güncelle
        const newNotificationPreferences = {
            ...user.notificationPreferences,
            ...notificationPreferences
        };

        await userDatabaseRepository.updateNotificationPreferences(userId, newNotificationPreferences)
        await userCacheHandler.clearUserCache(userId)

        return res.status(200).json(ApiResponse.success("Bildirim tercihleri başarıyla güncellendi.", user.notificationPreferences));
    } catch (error) {
        console.log(error)
        return res.status(500).json(
            ApiResponse.serverError("Bildirim tercihleri güncellenirken bir hata meydana geldi.", error)
        );
    }
};

export const userDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        let userData = await userCacheHandler.getCachedUserDashboardData(userId, userDatabaseRepository.getUserDashboard);
        if (!userData) return res.status(404).json(ApiResponse.notFound("Kullanici verisi bulunamadi."));

        let newEnrolledClasses = [];
        let newTeachingClasses = [];

        if (userData?.enrolledClasses.length > 0) {
            newEnrolledClasses = await multiGet(
                userData.enrolledClasses.map(c => typeof c === 'string' ? c : String(c._id)),
                "class",
                classDatabaseRepository.getMultiClassById
            );
        }

        if (userData?.teachingClasses.length > 0) {
            newTeachingClasses = await multiGet(
                userData.teachingClasses.map(c => typeof c === 'string' ? c : String(c._id)),
                "class",
                classDatabaseRepository.getMultiClassById
            );
        }

        const updatedUserData = {
            ...userData,
            enrolledClasses: newEnrolledClasses,
            teachingClasses: newTeachingClasses,
        };

        return res.status(200).json(ApiResponse.success("Kullanıcı bilgisi.", updatedUserData, 200));
    } catch (error) {
        console.log(error);
        return res.status(500).json(
            ApiResponse.serverError("Dashboard yüklenirken bir hata meydana geldi.", error)
        );
    }
};

export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user.id

        const user = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)
        if (!user) return res.status(404).json(ApiResponse.notFound("Kullanici bulunamadi."))
        if (user.role === "teacher" || user.role === "sysadmin") return res.status(400).json(ApiResponse.error("Bu roldeki kullanıcıyı engelleyemezsin."))
        const getBlockData = await userBlockDatabaseRepository.getBlockData(currentUser, userId)
        if (getBlockData) return res.status(400).json(ApiResponse.error("Kullanıcı zaten engellenmiş."))

        await userBlockDatabaseRepository.blockUser(currentUser, userId)
        await userBlockCacheHandler.addBlock(currentUser, userId)

        return res.status(200).json(ApiResponse.success("Kullanıcı engellendi.", user))
    } catch (error) {
        console.log(error)
        return res.status(500).json(
            ApiResponse.serverError("Kullanıcı engellenirken bir hata meydana geldi.", error)
        );
    }
}

export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user.id

        const user = await userCacheHandler.getCachedUserData(userId, userDatabaseRepository.getUserById)
        if (!user) return res.status(404).json(ApiResponse.notFound("Kullanici bulunamadi."))
        const getBlockData = await await userBlockDatabaseRepository.getBlockData(currentUser, userId)
        if (!getBlockData) return res.status(400).json(ApiResponse.error("Kullanıcı zaten engellenmemiş."))

        await userBlockDatabaseRepository.unblockUser(currentUser, userId)
        await userBlockCacheHandler.removeBlock(currentUser, userId)

        return res.status(200).json(ApiResponse.success("Kullanıcı engeli kaldırıldı.", user))
    } catch (error) {
        console.log(error)
        return res.status(500).json(
            ApiResponse.serverError("Kullanıcı engeli kaldırılırken bir hata meydana geldi.", error)
        );
    }
}