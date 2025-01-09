class MosaicGenerator {
  static async generate(images) {
    try {
      console.log('Processing', images.length, 'images for mosaic');

      // Calculate viewport constraints
      const viewportWidth = window.innerWidth - 32; // Account for padding
      const viewportHeight = window.innerHeight - 32;

      // Maximum size constraints (30% of viewport for better distribution)
      const maxImageWidth = viewportWidth * 0.3;
      const maxImageHeight = viewportHeight * 0.3;

      // Load and validate images
      const loadedImages = await Promise.all(
        images.map(async (src, index) => {
          try {
            const img = await new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve({
                src,
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                index
              });
              img.onerror = () => reject(new Error(`Failed to load image ${index + 1}`));
              img.src = src;
            });
            return img;
          } catch (error) {
            console.warn(`Skipping image ${index + 1} due to load error:`, error.message);
            return null;
          }
        })
      );

      // Filter out failed images
      const validImages = loadedImages.filter(img => img !== null);

      if (validImages.length === 0) {
        throw new Error('No valid images to display');
      }

      // Sort images by aspect ratio for better grouping
      validImages.sort((a, b) => Math.abs(1 - a.aspectRatio) - Math.abs(1 - b.aspectRatio));

      // Calculate optimal width for consistent sizing
      const avgAspectRatio = validImages.reduce((sum, img) => sum + img.aspectRatio, 0) / validImages.length;
      const baseWidth = Math.min(maxImageWidth, viewportWidth * 0.25); // 25% of viewport width
      const baseHeight = baseWidth / avgAspectRatio;

      return validImages.map(img => {
        // Calculate dimensions while maintaining aspect ratio
        let width = baseWidth;
        let height = baseWidth / img.aspectRatio;

        // Adjust if height exceeds maximum
        if (height > maxImageHeight) {
          height = maxImageHeight;
          width = height * img.aspectRatio;
        }

        return {
          ...img,
          style: {
            width: `${width}px`,
            height: `${height}px`,
            margin: '8px',
            flexGrow: '0',
            flexShrink: '0',
            position: 'relative'
          }
        };
      });
    } catch (error) {
      console.error('Error in image processing:', error);
      throw error;
    }
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}