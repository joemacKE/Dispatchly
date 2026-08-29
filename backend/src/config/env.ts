type NodeEnvironment =
  | "development"
  | "test"
  | "production";

const nodeEnvironment =
  (process.env.NODE_ENV ??
    "development") as NodeEnvironment;

const isProduction =
  nodeEnvironment === "production";

function getEnvironmentValue(
  name: string,
  developmentFallback?: string
) {
  const value =
    process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (
    !isProduction &&
    developmentFallback !== undefined
  ) {
    return developmentFallback;
  }

  throw new Error(
    `${name} environment variable is required`
  );
}

function getPort() {
  const raw =
    process.env.PORT ?? "3000";

  const port =
    Number(raw);

  if (
    !Number.isInteger(port) ||
    port <= 0
  ) {
    throw new Error(
      "PORT must be a valid positive integer"
    );
  }

  return port;
}

const jwtSecret =
  getEnvironmentValue(
    "JWT_SECRET",
    "dispatchly-local-development-secret-change-in-production"
  );

const qrSecret =
  getEnvironmentValue(
    "QR_SECRET",
    "dispatchly-local-qr-secret-change-in-production"
  );

const corsOriginsRaw =
  getEnvironmentValue(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3001"
  );

const databaseUrl =
  getEnvironmentValue(
    "DATABASE_URL",
    "postgres://postgres:postgres@localhost:5432/dispatchly"
  );

const redisUrl =
  getEnvironmentValue(
    "REDIS_URL",
    "redis://localhost:6379"
  );

const apiPublicUrl =
  getEnvironmentValue(
    "API_PUBLIC_URL",
    "http://localhost:8000"
  );

const trustProxy =
  process.env.TRUST_PROXY ===
  "true";

if (isProduction) {
  const insecureSecretMarkers = [
    "change-in-production",
    "development-secret",
    "local-development",
  ];

  for (const [
    name,
    secret,
  ] of [
    ["JWT_SECRET", jwtSecret],
    ["QR_SECRET", qrSecret],
  ] as const) {
    if (secret.length < 32) {
      throw new Error(
        `${name} must be at least 32 characters in production`
      );
    }

    if (
      insecureSecretMarkers.some(
        (marker) =>
          secret.includes(marker)
      )
    ) {
      throw new Error(
        `${name} is using an insecure development value`
      );
    }
  }

  if (
    corsOriginsRaw.includes(
      "localhost"
    )
  ) {
    throw new Error(
      "CORS_ORIGINS must not contain localhost in production"
    );
  }

  if (
    !apiPublicUrl.startsWith(
      "https://"
    )
  ) {
    throw new Error(
      "API_PUBLIC_URL must use HTTPS in production"
    );
  }
}

export const env = {
  NODE_ENV:
    nodeEnvironment,

  IS_PRODUCTION:
    isProduction,

  PORT:
    getPort(),

  DATABASE_URL:
    databaseUrl,

  REDIS_URL:
    redisUrl,

  JWT_SECRET:
    jwtSecret,

  QR_SECRET:
    qrSecret,

  API_PUBLIC_URL:
    apiPublicUrl,

  TRUST_PROXY:
    trustProxy,

  CORS_ORIGINS:
    corsOriginsRaw
      .split(",")
      .map(
        (origin) =>
          origin.trim()
      )
      .filter(Boolean),
};