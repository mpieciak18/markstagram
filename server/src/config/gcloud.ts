import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';

type FileRef = {
  name: string;
  save: (buffer: Buffer, options: { contentType: string }) => Promise<void>;
  delete: () => Promise<void>;
};

type Bucket = {
  file: (name: string) => FileRef;
};

const shouldMockCloudStorage =
  process.env.MOCK_CLOUD_STORAGE === '1' || process.env.NODE_ENV === 'test';
const hasStorageConfig =
  !shouldMockCloudStorage && Boolean(process.env.GCLOUD_KEY && process.env.APP_URL);

let bucket: Bucket;
if (hasStorageConfig) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.GCLOUD_KEY || '', 'base64').toString('ascii'),
  );

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.APP_URL,
    });
  }

  bucket = getStorage().bucket() as unknown as Bucket;
} else {
  bucket = {
    file: (name: string) => ({
      name,
      save: async () => {
        // No-op fallback for local/test environments without cloud storage config.
      },
      delete: async () => {
        // No-op fallback for local/test environments without cloud storage config.
      },
    }),
  };
}

export { bucket };

export const getUrl = async (
  ref: ReturnType<typeof bucket.file>,
): Promise<string> => {
  if (!hasStorageConfig) {
    return `https://local-storage.invalid/${encodeURIComponent(ref.name)}`;
  }

  const url = await getDownloadURL(ref as never);
  return url;
};

export const deleteFileFromStorage = async (url: string): Promise<void> => {
  if (!hasStorageConfig) {
    return;
  }

  try {
    const parsedUrl = new URL(url);
    const marker = `/v0/b/${process.env.APP_URL}/o/`;
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex === -1) {
      throw new Error("Couldn't extract file name from the URL");
    }
    const encodedFileName = parsedUrl.pathname.slice(markerIndex + marker.length);
    const fileName = decodeURIComponent(encodedFileName);

    if (!fileName) {
      throw new Error("Couldn't extract file name from the URL");
    }

    // Now, you can delete the file from the bucket
    await bucket.file(fileName).delete();
    console.log(`Successfully deleted file ${fileName} from Firebase Storage.`);
  } catch (error) {
    const maybeCode = (error as { code?: number }).code;
    if (maybeCode === 404) {
      // Idempotent deletion: missing object means we're already in the desired state.
      return;
    }
    console.error('Error deleting the file:', error);
  }
};
