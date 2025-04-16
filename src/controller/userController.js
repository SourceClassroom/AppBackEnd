import bcrypt from 'bcryptjs';
import ApiResponse from "../utils/apiResponse.js";
import TokenService from "../services/jwtService.js";
import *as fileService from "../services/fileService.js";
import {processMedia} from "../services/fileService.js";

//Cache Modules
import *as userCacheModule from "../cache/modules/userModule.js";
import *as tokenCacheModule from "../cache/modules/tokenModule.js";

//Database Modules
import *as userDatabaseModule from "../database/modules/userModule.js";
import {invalidateKeys} from "../cache/strategies/invalidate.js";

/**
 * Kullanıcı bilgisi alma
 * @route GET /api/users/:id
 * @access Public
 * */
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById)

        if (!userData) {
            return res.status(404).jsonp(ApiResponse.notFound("Bu id ile bir kullanic bulunamadi"))
        }

        const formattedData = {
            profile: userData.profile,
            name: userData.name,
            surname: userData.surname,
            role: userData.role,
            accountStatus: userData.accountStatus,
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin
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

        // Check if first user
        const existingUsers = await userCacheModule.getUserCount(userDatabaseModule.getUserCount);
        console.log(existingUsers)
        const isFirstUser = existingUsers === 0;

        // E-posta kontrolü
        const existingUser = await userDatabaseModule.getUserByEmail(email)
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
        const accountStatus = userRole === "teacher" ? 'pending' : 'active';

        // Yeni kullanıcı oluştur
        const newUserData = {
            name,
            surname,
            email,
            password: hashedPassword,
            role: userRole,
            accountStatus,
            tokenVersion: TokenService.generateVersionCode()
        }

        const newUser = await userDatabaseModule.createUser(newUserData)

        const token = await TokenService.generateAccessToken({
            id: newUser._id,
            role: newUser.role,
            tokenVersion: newUser.tokenVersion
        });
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
                    user: userResponse,
                    token
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
        const user = await userDatabaseModule.getUserLoginData(email)
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
        await userDatabaseModule.updateLastLogin(user._id)

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
        const user = await userDatabaseModule.getUserLoginData(userEmail)
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
        await userDatabaseModule.changePassword(userId, hashedPassword, newTokenVersion)

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

        res.status(200).json(
            ApiResponse.success(
                'Şifre başarıyla değiştirildi',
                {
                    token // Yeni token döndür
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

        const findUser = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById)
        if(findUser.email === email) return res.status(400).json(ApiResponse.error("Yeni mail eskisi ile aynı olamaz."))

        const updateUser = await userDatabaseModule.changeEmail(userId, email)
        await userCacheModule.clearUserCache(userId)

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
        const currentUserData = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById)
        const fileIds = await processMedia(req)

        await userDatabaseModule.changeAvatar(userId, fileIds[0])

        //await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`])
        await userCacheModule.clearUserCache(userId)
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

        const user = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById)
        if (!user) {
            return res.status(404).json(ApiResponse.error("Kullanıcı bulunamadı."));
        }

        // Mevcut profil verisini koruyarak güncelle
        const updatedProfileData = {
            name: name ?? user.name,
            surname: surname ?? user.surname,
            profile: {
                avatar: user.profile.avatar,  // Eski avatarı koru
                bio: profile?.bio ?? user.profile.bio,
                institutionId: profile?.institutionId ?? user.profile.institutionId,
            }
        };

        await userDatabaseModule.updateProfile(userId, updatedProfileData)
        await userCacheModule.clearUserCache(userId)
        //await invalidateKeys([`user:${userId}`, `user:${userId}:dashboard`])

        return res.status(200).json(ApiResponse.success("Profil başarıyla güncellendi.", user));
    } catch (error) {
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
        const user = await userCacheModule.getCachedUserData(userId, userDatabaseModule.getUserById(userId))
        if (!user) {
            return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."));
        }

        // Mevcut notificationPreferences'ı koruyarak güncelle
        const newNotificationPreferences = {
            ...user.notificationPreferences,
            ...notificationPreferences
        };

        await userDatabaseModule.updateNotificationPreferences(userId, newNotificationPreferences)
        await userCacheModule.clearUserCache(userId)

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
        const userData = await userCacheModule.getCachedUserDashboardData(userId, userDatabaseModule.getUserDashboard)

        if (!userData) return res.status(404).json(ApiResponse.notFound("Kullanici verisi bulunamadi."));

        return res.status(200).json(ApiResponse.success("Kullanıcı bilgisi.", userData, 200));
    } catch (error) {
        console.log(error)
        return res.status(500).json(
            ApiResponse.serverError("Dashboard yüklenirken bir hata meydana geldi.", error)
        );
    }
}