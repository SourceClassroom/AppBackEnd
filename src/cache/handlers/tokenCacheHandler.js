import { client } from "../client/redisClient.js";

export const blacklistToken = async (token, ex) => {
  try {
    await client.set(`blacklistToken:${token}`, "blacklisted", "EX", ex);
  } catch (error) {
    console.error("Error blacklisting token:", error);
    throw error;
  }
};