/**
 * Utility to compress a Base64 image string or file to a lightweight JPEG Base64 representation.
 * Resizes the image to fall under a maximum width/height while preserving aspect ratio.
 * This ensures that when uploading custom course images, they do not exceed the localStorage quota (5MB).
 */
export function compressImage(
  base64Str: string,
  maxWidth = 600,
  maxHeight = 400,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If the image is not a base64 string or is very small, return it directly
    if (!base64Str || !base64Str.startsWith('data:') || base64Str.length < 5000) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Avoid tainted canvas issues if possible
    img.src = base64Str;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scale factors
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert the canvas drawing directly into a compressed JPEG Base64 representation
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } else {
          resolve(base64Str);
        }
      } catch (err) {
        console.error('Error during canvas compression:', err);
        resolve(base64Str);
      }
    };

    img.onerror = (err) => {
      console.error('Error loading image for compression:', err);
      resolve(base64Str);
    };
  });
}
