import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function configuredClient() {
  const { STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY } = process.env;
  if (!STORAGE_ENDPOINT || !STORAGE_REGION || !STORAGE_BUCKET || !STORAGE_ACCESS_KEY || !STORAGE_SECRET_KEY) throw new Error("PRIVATE_STORAGE_NOT_CONFIGURED");
  return { bucket: STORAGE_BUCKET, client: new S3Client({ endpoint: STORAGE_ENDPOINT, region: STORAGE_REGION, forcePathStyle: true, credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY } }) };
}

export async function createPrivateUploadUrl(input: { key: string; contentType: string; sizeBytes: number }) {
  const { bucket, client } = configuredClient();
  const command = new PutObjectCommand({ Bucket: bucket, Key: input.key, ContentType: input.contentType, ContentLength: input.sizeBytes, Metadata: { visibility: "private-unapproved" } });
  return getSignedUrl(client, command, { expiresIn: 15 * 60 });
}
