import TokenService from "../../services/jwtService.js";

export default async function authMiddleware(socket, next) {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
        const decoded = await TokenService.verifyToken(token);
        socket.userId = decoded.id;
        next();
    } catch (err) {
        console.error("Socket Auth Error:", err.message);
        next(new Error("Authentication error"));
    }
}
