import Redis from "ioredis";

export const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
});

client.on("error", (err) => {
    console.error("Redis bağlantı hatası:", err);
});

export const redisConnect = async () => {
    client.once("ready", () => {
        console.log("Redis connected successfully!");
    });

    client.once("error", (error) => {
        console.log(`Redis connection error: ${error}`);
    });
};
