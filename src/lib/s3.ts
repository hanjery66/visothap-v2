import { put, del } from '@vercel/blob';

/**
 * Upload file to Vercel Blob with public read access
 */
export async function uploadFileToS3(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${fileName}`;

  const blob = await put(key, fileBuffer, {
    contentType,
    access: 'public',
  });

  return blob.url;
}

/**
 * Delete file from Vercel Blob
 */
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  try {
    console.log("Delete: ", fileUrl)
    await del(fileUrl);
  } catch (error) {
    console.error('Error deleting file from Blob:', error);
  }
}