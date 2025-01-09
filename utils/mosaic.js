class MosaicGenerator {
  static PATTERNS = {
    GRID: 'grid',
    HONEYCOMB: 'honeycomb'
  };

  static async generate(images) {
    try {
      console.log('Processing', images.length, 'images for mosaic');

      // Calculate viewport constraints
      const viewportWidth = window.innerWidth - 32; // Account for padding
      const viewportHeight = window.innerHeight - 32;

      // Maximum size constraints (40% of viewport)
      const maxImageWidth = viewportWidth * 0.4;
      const maxImageHeight = viewportHeight * 0.4;

      // Maximum gap (20% of viewport width)
      const maxGap = viewportWidth * 0.2;

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

      return validImages.map(img => {
        // Calculate base dimensions
        let imgHeight = maxImageHeight;
        let imgWidth = imgHeight * img.aspectRatio;

        // Scale down if width exceeds maximum
        if (imgWidth > maxImageWidth) {
          imgWidth = maxImageWidth;
          imgHeight = imgWidth / img.aspectRatio;
        }

        return {
          ...img,
          style: {
            width: `${imgWidth}px`,
            height: `${imgHeight}px`
          }
        };
      });

    } catch (error) {
      console.error('Error in image processing:', error);
      throw error;
    }
  }

  static generateHoneycomb(validImages, viewportWidth, viewportHeight) {
    const maxSize = Math.min(viewportWidth, viewportHeight) * 0.4; // 40% of viewport
    const hexSize = maxSize * 0.8; // Slightly smaller for gaps
    const horizontalSpacing = hexSize * 0.75;
    const verticalSpacing = hexSize * 0.866; // height = width * sin(60°)

    const columns = Math.floor(viewportWidth / horizontalSpacing);
    const rows = Math.ceil(validImages.length / columns);

    return validImages.map((img, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const isOddRow = row % 2 === 1;

      // Calculate position with offset for odd rows
      const x = col * horizontalSpacing + (isOddRow ? horizontalSpacing / 2 : 0);
      const y = row * verticalSpacing;

      return {
        ...img,
        style: {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: `${hexSize}px`,
          height: `${hexSize}px`,
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          transition: 'all 0.3s ease'
        }
      };
    });
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}