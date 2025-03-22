import ApiResponse from "../utils/apiResponse.js";
import TokenService from "../services/jwtService.js";

const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies?.jsonwebtoken || req.headers?.authorization?.split(" ")[1];
        if (token) {
            req.user = await TokenService.verifyToken(token);
            next();
        } else {
            return res.status(401).send(ApiResponse.unauthorized("Giriş için login sayfasına yönlendiriliyor."))
        }
    } catch (err) {
        console.log(err)
        res.status(401).json({
            succeeded: false,
            error: 'Not authorized'
        });
    }
}

export {
    authenticateToken
}