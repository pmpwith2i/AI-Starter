import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { randomUUID } from "crypto";

let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: ENVIRONMENT_VARIABLES.AWS_REGION,
      credentials: {
        accessKeyId: ENVIRONMENT_VARIABLES.AWS_ACCESS_KEY_ID,
        secretAccessKey: ENVIRONMENT_VARIABLES.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

const getExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] ?? "bin";
};

export const uploadToS3 = async (
  buffer: Buffer,
  contentType: string,
  folder: string,
): Promise<string> => {
  const bucket = ENVIRONMENT_VARIABLES.AWS_S3_BUCKET;
  const ext = getExtension(contentType);
  const key = `${folder}/${randomUUID()}.${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `https://${bucket}.s3.${ENVIRONMENT_VARIABLES.AWS_REGION}.amazonaws.com/${key}`;
};
