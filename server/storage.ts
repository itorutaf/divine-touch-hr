/**
 * CareBase Storage Service
 * Replaces Manus Forge proxy with S3 + local filesystem fallback.
 * When AWS_S3_BUCKET is not set, files are stored locally for development.
 */

import { ENV } from "./_core/env";
import path from "node:path";
import fs from "node:fs/promises";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".local-uploads");

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ── S3 Storage (production) ────────────────────────────────────────

async function s3Put(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: ENV.s3Region });

  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: ENV.kmsKeyArn ? "aws:kms" : "AES256",
      ...(ENV.kmsKeyArn ? { SSEKMSKeyId: ENV.kmsKeyArn } : {}),
    })
  );

  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }),
    { expiresIn: 900 } // 15 minutes
  );

  return { key, url };
}

async function s3Get(key: string): Promise<{ key: string; url: string }> {
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const client = new S3Client({ region: ENV.s3Region });
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }),
    { expiresIn: 900 }
  );

  return { key, url };
}

// ── Local Filesystem Storage (development fallback) ────────────────

async function localPut(
  key: string,
  data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const filePath = path.join(LOCAL_STORAGE_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const content = typeof data === "string" ? data : Buffer.from(data);
  await fs.writeFile(filePath, content);

  return { key, url: `/api/files/${key}` };
}

async function localGet(key: string): Promise<{ key: string; url: string }> {
  return { key, url: `/api/files/${key}` };
}

// ── Public API (same signatures as before) ─────────────────────────

const useS3 = () => Boolean(ENV.s3Bucket);

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (useS3()) {
    return s3Put(key, data, contentType);
  }
  return localPut(key, data, contentType);
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (useS3()) {
    return s3Get(key);
  }
  return localGet(key);
}
