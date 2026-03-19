export const ENV = {
  appId: process.env.VITE_APP_ID ?? "carebase",
  cookieSecret: process.env.JWT_SECRET ?? "carebase-dev-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // AWS S3 (optional — falls back to local storage in dev)
  s3Bucket: process.env.AWS_S3_BUCKET ?? "",
  s3Region: process.env.AWS_S3_REGION ?? "us-east-1",
  kmsKeyArn: process.env.KMS_KEY_ARN ?? "",
};
