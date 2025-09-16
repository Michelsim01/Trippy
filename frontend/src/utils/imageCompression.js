/**
 * Compresses a base64 image by reducing its quality and size
 * @param {string} base64String - The base64 image string
 * @param {number} quality - Compression quality (0.1 to 1.0, default 0.7)
 * @param {number} maxWidth - Maximum width in pixels (default 800)
 * @param {number} maxHeight - Maximum height in pixels (default 600)
 * @returns {Promise<string>} Compressed base64 string
 */
export const compressBase64Image = async (base64String, quality = 0.7, maxWidth = 800, maxHeight = 600) => {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create a canvas element
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          resolve(compressedBase64);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the image source
      img.src = base64String;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Checks if a base64 string is too large and needs compression
 * @param {string} base64String - The base64 string to check
 * @param {number} maxSizeKB - Maximum size in KB (default 500KB)
 * @returns {boolean} True if the string is too large
 */
export const isBase64TooLarge = (base64String, maxSizeKB = 500) => {
  if (!base64String) return false;
  
  // Calculate approximate size in bytes
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  
  return sizeInKB > maxSizeKB;
};

/**
 * Gets a fallback image URL if base64 is too large or invalid
 * @param {string} base64String - The base64 string
 * @param {number} fallbackIndex - Index for fallback image (default 0)
 * @returns {string} Fallback image URL
 */
export const getFallbackImageUrl = (base64String, fallbackIndex = 0) => {
  const fallbackImages = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502602898669-a38738f73650?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1545892204-e37749721199?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503377992-e1123f72969b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];
  
  return fallbackImages[fallbackIndex % fallbackImages.length];
};
