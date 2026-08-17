import { TicketAttachment } from '../types';

/**
 * Compresses image files using HTML5 Canvas to keep DataURL payload light (<150KB)
 * and prevent localStorage quota errors or Supabase payload truncation.
 * If file is not an image, reads as standard base64 DataURL.
 */
export async function processFileAttachment(file: File): Promise<TicketAttachment> {
  const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|gif|webp|bmp)$/i);

  if (isImage) {
    try {
      const dataUrl = await compressImage(file, 1200, 1200, 0.75);
      // Estimate compressed size
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      const sizeStr = approxBytes >= 1024 * 1024
        ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(approxBytes / 1024)} KB`;

      return {
        name: file.name,
        size: sizeStr,
        type: file.type || 'image/jpeg',
        url: dataUrl
      };
    } catch (err) {
      console.warn('Image compression fallback to standard FileReader:', err);
    }
  }

  // Fallback for non-image files or failed compression
  return new Promise((resolve) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve({
        name: file.name,
        size: `${sizeMB} MB`,
        type: file.type || 'application/octet-stream',
        url: (event.target?.result as string) || ''
      });
    };
    reader.readAsDataURL(file);
  });
}

function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not supported'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed JPEG
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(outputType, quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
