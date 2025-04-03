import bcrypt from 'bcryptjs';
import ApiResponse from "../utils/ApiResponse.js";
import TokenService from "../services/jwtService.js";
import {User} from "../database/models/userModel.js";
import *as fileService from "../services/fileService.js";
import {processMedia} from "../services/fileService.js";
import *as cacheService from "../services/cacheService.js";


/**
 * Kullanıcı bilgisi alma
 * @route GET /api/users/:id
 * @access Public
 * */
export const getUsers = async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = await cacheService.getUserFromCacheOrCheckDb(userId)

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

        // E-posta kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json(
                ApiResponse.error('Bu e-posta adresi zaten kullanılıyor')
            );
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const accountStatus =  role === "teacher" ? 'pending' : 'active'
        // Yeni kullanıcı oluştur
        const newUser = new User({
            name,
            surname,
            email,
            password: hashedPassword,
            role: role || 'student', // Varsayılan rol öğrenci
            accountStatus,
            tokenVersion: TokenService.generateVersionCode(),
        });

        // Kullanıcıyı kaydet
        await newUser.save();

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
        const user = await User.findOne({ email });
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
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };
        await User.findOneAndUpdate({ email }, {$set: {lastLogin: new Date()}})
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
        const { currentPassword, newPassword } = req.body;

        // Giriş kontrolü
        if (!currentPassword || !newPassword) {
            return res.status(400).json(
                ApiResponse.error('Mevcut şifre ve yeni şifre gereklidir')
            );
        }

        // Kullanıcıyı bul (şifre dahil)
        const user = await User.findById(userId);
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
        if (currentPassword === newPassword) {
            return res.status(400).json(ApiResponse.error("Eski şifre ile yeni şifre aynı olamaz."))
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Token sürümünü artır (JWT'leri geçersiz kılmak için)
        const newTokenVersion = TokenService.generateVersionCode();

        // Kullanıcıyı güncelle
        user.password = hashedPassword;
        user.tokenVersion = newTokenVersion;
        await user.save();

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
        const cacheKey = `user:${userId}`;

        if (!email) return res.status(400).json(ApiResponse.error("Email alanı zorunludur."))

        const findUser = await cacheService.getUserFromCacheOrCheckDb(userId);
        if(findUser.email === email) return res.status(400).json(ApiResponse.error("Yeni mail eskisi ile aynı olamaz."))

        const updateUser = await User.findByIdAndUpdate(userId, {$set: {email}}, {new: true}).select("-password");
        await cacheService.removeFromCache(cacheKey);

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
        //Check files even isn't required (check /middleware/upload.js)
        if (req.files.length === 0 || !req.files) {
            return res.status(400).json(ApiResponse.error("En az 1 dosya yüklenmeli."));
        }
        const currentUserData = await cacheService.getUserFromCacheOrCheckDb(userId)
        const fileIds = await processMedia(req)

        const updateUser = await User.findByIdAndUpdate(
            userId,
            { $set: { "profile.avatar": fileIds[0] } }, // Sadece avatar'ı güncelle
            { new: true }
        ).select("-password");

        await cacheService.writeToCache(`user:${userId}`, updateUser, 3600)
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

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json(ApiResponse.error("Kullanıcı bulunamadı."));
        }

        // Mevcut profil verisini koruyarak güncelle
        const updatedProfile = {
            avatar: user.profile.avatar,  // Eski avatarı koru
            bio: profile?.bio ?? user.profile.bio,
            institutionId: profile?.institutionId ?? user.profile.institutionId,
        };

        user.name = name ?? user.name;
        user.surname = surname ?? user.surname;
        user.profile = updatedProfile;

        await user.save();
        await cacheService.writeToCache(cacheKey, user, 3600);

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
        const cacheKey = `user:${userId}`;

        // Kullanıcıyı bul
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."));
        }

        // Mevcut notificationPreferences'ı koruyarak güncelle
        user.notificationPreferences = {
            ...user.notificationPreferences,
            ...notificationPreferences
        };

        await user.save();
        await cacheService.removeFromCache(cacheKey);

        return res.status(200).json(ApiResponse.success("Bildirim tercihleri başarıyla güncellendi.", user.notificationPreferences));
    } catch (error) {
        console.log(error)
        return res.status(500).json(
            ApiResponse.serverError("Bildirim tercihleri güncellenirken bir hata meydana geldi.", error)
        );
    }
};
