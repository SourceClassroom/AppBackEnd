import { Server } from "socket.io";
import authMiddleware from "./middleware/auth.js";
import { setSocketServer } from "./socketInstance.js";
import { registerSocketEvents } from "./listeners/default.js";
import scanAndDelete from "../cache/strategies/scanAndDelete.js";
import { startSocketSubscriber } from "../cache/redisSocketPubSub/socketPubSub.js";

export default async function socketHandler(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        },
        allowEIO3: true,
        transports: ["websocket", "polling"]
    });

    await scanAndDelete("socket");
    await startSocketSubscriber()

    setSocketServer(io);

    io.use(authMiddleware); // sockets.userId eklenecek

    io.on("connection", (socket) => {
        registerSocketEvents(socket);
    });
}
