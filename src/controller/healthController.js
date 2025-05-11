import mongoose from "mongoose";
import {client} from "../cache/client/redisClient.js";

// Health check endpoint to verify API is running
export const healthCheck = async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = client.status === 'ready';

  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const humanReadableUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const status = isDbConnected && isRedisConnected ? 'healthy' : 'degraded';

  res.status(isDbConnected && isRedisConnected ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: humanReadableUptime,
    database: {
      connected: isDbConnected,
      state: mongoose.connection.readyState
    },
    redis: {
      connected: isRedisConnected
    }
  });
};