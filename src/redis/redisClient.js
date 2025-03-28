import redis from "redis"

export const client = redis.createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

client.on("error", (err) => console.error("Redis bağlantı hatası:", err));

export const redisConnect = async () => {
    await client.connect().then(() => {
        console.log("Redis connected successfuly!")
    }).catch((error) => {
        console.log(`Redis connection error. ${error}`)
    })
}
