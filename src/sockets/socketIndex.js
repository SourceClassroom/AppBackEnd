import { Server } from "socket.io";
import authMiddleware from "./middleware/auth.js";
import { setSocketServer } from "./socketInstance.js";
import { registerSocketEvents } from "./listeners/default.js";
import scanAndDelete from "../cache/strategies/scanAndDelete.js";
import { startSocketSubscriber } from "../cache/socket/socketPubSub.js";

export default async function socketHandler(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        },
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
