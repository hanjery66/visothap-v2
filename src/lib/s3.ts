import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";

// Initialize S3 client configured for MinIO
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = env.MINIO_BUCKET;

// Public bucket policy that allows anonymous read access to all objects
const BUCKET_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
    },
  ],
});

/**
 * Check if bucket exists, create it if not, and apply public bucket policy
 */
async function ensureBucketExists() {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error: any) {
    if (error.name === "NotFound") {
      // Create the bucket since it doesn't exist
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`Bucket '${BUCKET_NAME}' created successfully`);
    } else {
      throw error;
    }
  }

  // Apply public bucket policy
  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: BUCKET_POLICY,
      })
    );
    console.log(`Public policy applied to bucket '${BUCKET_NAME}'`);
  } catch (error) {
    console.error(`Error applying bucket policy:`, error);
  }
}

// Initialize bucket on module load
ensureBucketExists().catch(console.error);

/**
 * Upload file to MinIO bucket with public read access
 */
export async function uploadFileToS3(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  // Construct the file URL
  const endpointUrl = new URL(env.MINIO_ENDPOINT);
  return `${endpointUrl.href}${BUCKET_NAME}/${key}`;
}

/**
 * Delete file from MinIO bucket
 */
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL (format: http://endpoint/bucket/key)
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");
    // pathParts will be ["", "bucket-name", "uploads", "filename.ext"]
    const key = pathParts.slice(2).join("/");

    if (key) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
    }
  } catch (error) {
    console.error("Error deleting file from S3:", error);
  }
}
