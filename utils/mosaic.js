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
      const maxImagesPerRow = Math.min(3, images.length); // Max 3 images per row

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
      validImages.sort((a, b) => b.aspectRatio - a.aspectRatio);

      // Group images into rows
      const result = [];
      let currentRow = [];

      validImages.forEach((img, index) => {
        // Start a new row if we've reached the maximum images per row
        if (currentRow.length >= maxImagesPerRow) {
          result.push(...currentRow);
          currentRow = [];
        }

        // Calculate dimensions while maintaining aspect ratio
        const maxWidth = viewportWidth / maxImagesPerRow * 0.9; // 90% of available width per image
        const maxHeight = viewportHeight * 0.4; // 40% of viewport height

        let imgWidth = maxHeight * img.aspectRatio;
        let imgHeight = maxHeight;

        // Adjust if width exceeds max
        if (imgWidth > maxWidth) {
          imgWidth = maxWidth;
          imgHeight = imgWidth / img.aspectRatio;
        }

        // Add image to current row
        currentRow.push({
          ...img,
          style: {
            width: `${imgWidth}px`,
            height: `${imgHeight}px`
          },
          newRow: currentRow.length === 0
        });
      });

      // Add remaining images in the last row
      if (currentRow.length > 0) {
        result.push(...currentRow);
      }

      return result;

    } catch (error) {
      console.error('Error in image processing:', error);
      throw error;
    }
  }

  static generateHoneycomb(validImages, viewportWidth, viewportHeight, maxImageWidth, maxImageHeight) {
    // Calculate hexagon dimensions
    const hexWidth = Math.min(maxImageWidth, maxImageHeight) * 0.8;  // Slightly smaller for overlap
    const hexHeight = hexWidth * 0.866; // height = width * sin(60°)
    const horizontalSpacing = hexWidth * 0.75; // 25% overlap for tight packing
    const verticalSpacing = hexHeight * 0.85; // 15% overlap for tight packing

    // Calculate grid dimensions
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
          width: `${hexWidth}px`,
          height: `${hexHeight}px`,
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          transition: 'transform 0.3s ease',
          zIndex: isOddRow ? 1 : 0
        },
        isHoneycomb: true
      };
    });
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}