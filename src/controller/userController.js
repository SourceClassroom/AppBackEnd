import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ApiResponse from "../utils/ApiResponse.js";
import TokenService from "../services/jwtService.js";
import {User} from "../database/models/userModel.js";

/**
 * Kullanıcı bilgisi alma
 * @route GET /users/:id
 * @access Public
 * */
const getUsers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, {password: false})
        if (!user) return res.status(404).json(ApiResponse.notFound("Kullanıcı bulunamadı."));
        return res.status(200).json(ApiResponse.success("Kullanıcı bilgisi.", user, 200));
    } catch (error) {
        return res.status(500).json(ApiResponse.error("Kullanıcı bilgisi alınırken hata meydana geldi.", error));
    }
}

/**
 * Yeni kullanıcı oluşturma
 * @route POST /api/users/register
 * @access Public
 */
const createUser = async (req, res) => {
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

        // Yeni kullanıcı oluştur
        const newUser = new User({
            name,
            surname,
            email,
            password: hashedPassword,
            role: role || 'student' // Varsayılan rol öğrenci
        });

        // Kullanıcıyı kaydet
        await newUser.save();

        // JWT token oluştur
        const payload = {
            user: {
                id: newUser._id,
                role: newUser.role
            }
        };

        const token = await TokenService.generateAccessToken({
            id: newUser._id,
            role: newUser.role
        });
        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            surname: newUser.surname,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
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
            ApiResponse.serverError('Kullanıcı oluşturulurken bir hata oluştu')
        );
    }
}

/**
 * Kullanıcı girişi
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = async (req, res) => {
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
            role: user.role
        });

        // Hassas verileri kaldır
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };

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
            ApiResponse.serverError('Giriş yapılırken bir hata oluştu')
        );
    }
};

export {getUsers, createUser, loginUser};