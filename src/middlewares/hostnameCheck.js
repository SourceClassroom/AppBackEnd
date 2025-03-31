import ApiResponse from "../utils/apiResponse.js";

export default (req, res, next) => {
    const trustedHostname = process.env.TRUSTED_HOSTNAME
    if (!trustedHostname) return next()

    const host = req.headers["host"] || req.headers["x-forwarded-host"] || req.hostname;

    if (host !== trustedHostname) {
        return res.status(403).json(ApiResponse.forbidden("Forbidden - Invalid Jostname"))
    }

    next();
}