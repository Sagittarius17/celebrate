import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Optimizes an image by resizing it to a maximum dimension and compressing it.
 * This helps reduce the "media resolution" to an applicable size for web performance.
 */
export async function optimizeImage(base64Str: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  // If it's not an image (e.g. video data uri), skip optimization
  if (!base64Str.startsWith('data:image/')) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Only downscale if the image is larger than the threshold
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      } else if (height > maxWidth) {
        width = (maxWidth / height) * width;
        height = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      // We convert to jpeg for best compression ratio vs quality
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
}
