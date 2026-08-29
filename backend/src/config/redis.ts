import { createClient } from "redis";

const redisUrl =
  process.env.REDIS_URL ?? "redis://redis:6379";

export const redis = createClient({
  url: redisUrl,
});

export const redisSubscriber = redis.duplicate();

redis.on("error", (error) => {
  console.error("Redis client error:", error);
});

redisSubscriber.on("error", (error) => {
  console.error("Redis subscriber error:", error);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  if (!redisSubscriber.isOpen) {
    await redisSubscriber.connect();
  }
}

export async function disconnectRedis() {
  if (redisSubscriber.isOpen) {
    await redisSubscriber.quit();
  }

  if (redis.isOpen) {
    await redis.quit();
  }
}