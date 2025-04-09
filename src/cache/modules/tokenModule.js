import { client } from "../client/redisClient.js";

export const blacklistToken = async (token, ex) => {
  try {
    await client.setEx(`blacklistToken:${token}`, ex, "blacklisted");
  } catch (error) {
    console.error("Error blacklisting token:", error);
    throw error;
  }
};