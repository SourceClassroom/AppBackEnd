import TokenService from "../services/jwtService.js";
import { setSocketServer } from "./socketInstance.js";
import * as onlineUserCacheModule from "../cache/modules/onlineUserModule.js";

export default function socketHandler(server) {
    import("socket.io").then(({ Server }) => {
        const io = new Server(server, {
            cors: {
                origin: "*", // İstersen burada CORS'u daha güvenli yapabiliriz.
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            }
        });

        setSocketServer(io); // Global olarak io'yu kaydediyoruz!

        io.use(async (socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }

            try {
                const decoded = await TokenService.verifyToken(token);
                socket.userId = decoded.id;
                next();
            } catch (err) {
                console.error("Socket Auth Error:", err.message);
                return next(new Error(err.message || "Authentication error"));
            }
        });

        io.on("connection", (socket) => {
            const userId = socket.userId;

            onlineUserCacheModule.addUserSocket(userId, socket.id)
                .then(() => console.log(`User ${userId} set online.`))
                .catch((err) => console.error("Error setting user online:", err.message));

            socket.on("disconnect", () => {
                onlineUserCacheModule.removeUserSocket(userId, socket.id)
                    .then(() => console.log(`User ${userId} removed from online list.`))
                    .catch((err) => console.error("Error removing user:", err.message));
            });
        });
    });
}
