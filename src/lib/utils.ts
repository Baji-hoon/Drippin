/**
 * Converts a Blob URL (like the one from the camera/upload) into a File object.
 * This is needed because we pass the URL between pages.
 * @param blobUrl The temporary URL of the image blob.
 * @param fileName The desired name for the new file.
 * @returns A promise that resolves with the new File object.
 */
export const blobUrlToFile = async (blobUrl: string, fileName: string): Promise<File> => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
};

/**
 * Resizes an image to a small thumbnail for saving in Firestore.
 * This is crucial for keeping the app on Firebase's free tier by avoiding large document sizes.
 * @param file The original image file to resize.
 * @param quality The quality of the output JPEG image (0 to 1).
 * @returns A promise that resolves with the full Base64 Data URL of the thumbnail.
 */
export const resizeImageForThumbnail = (file: File, quality: number = 0.75): Promise<string> => {
  const MAX_WIDTH = 400; // Small thumbnail size for Firestore

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Converts a File object to a raw Base64 string for the Gemini API.
 * This sends the original, full-quality image data.
 * @param file The file to convert.
 * @returns A promise that resolves with the raw Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // This reliably removes the prefix, e.g., "data:image/jpeg;base64,"
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * Downscale an image File to JPEG and return the raw base64 (no data: prefix).
 * Keeps aspect ratio. Default max width 1024 and quality 0.85 greatly reduce payload size for serverless APIs.
 */
export const fileToBase64JpegDownscaled = (
  file: File,
  maxWidth = 1024,
  quality = 0.85
): Promise<{ base64: string; mimeType: 'image/jpeg' }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};