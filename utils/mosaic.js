class MosaicGenerator {
  static async generate(images) {
    try {
      console.log('Processing', images.length, 'images for mosaic');

      // Calculate viewport constraints
      const viewportWidth = window.innerWidth - 32;
      const viewportHeight = window.innerHeight - 32;
      const maxImageWidth = viewportWidth * 0.4;  // 40% of viewport width
      const maxImageHeight = viewportHeight * 0.4; // 40% of viewport height

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

      // Calculate optimal row distribution
      const targetRowCount = Math.ceil(Math.sqrt(validImages.length * (viewportWidth / viewportHeight)));
      const targetRowHeight = Math.min(
        Math.floor(viewportHeight / targetRowCount),
        maxImageHeight
      );

      // Group images into optimal rows
      const rows = this.calculateOptimalRows(validImages, viewportWidth, targetRowHeight, maxImageWidth);

      // Process rows to ensure they fill the viewport width
      const processedImages = rows.flatMap((row, rowIndex) => {
        // Calculate total width and gaps
        const totalGapWidth = Math.min(
          (row.length - 1) * 8, // minimum gap
          viewportWidth * 0.2 // maximum 20% of viewport width for gaps
        );

        const rowWidth = row.reduce((sum, img) => 
          sum + (img.aspectRatio * targetRowHeight), 0);

        // Calculate scale to fill width while respecting max size constraints
        const scale = Math.min(
          (viewportWidth - totalGapWidth) / rowWidth,
          maxImageHeight / targetRowHeight
        );

        return row.map((img, index) => {
          const scaledHeight = targetRowHeight * scale;
          const scaledWidth = Math.min(
            img.aspectRatio * scaledHeight,
            maxImageWidth
          );

          return {
            ...img,
            newRow: index === 0,
            style: {
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              flex: '0 0 auto',
              margin: '0'
            }
          };
        });
      });

      return processedImages;
    } catch (error) {
      console.error('Error in image processing:', error);
      throw error;
    }
  }

  static calculateOptimalRows(images, viewportWidth, targetHeight, maxImageWidth) {
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;
    const maxGapPerRow = viewportWidth * 0.2; // 20% of viewport width

    images.forEach(img => {
      const scaledWidth = Math.min(
        img.aspectRatio * targetHeight,
        maxImageWidth
      );

      // Start new row if adding this image would exceed max gap constraint
      const potentialGap = viewportWidth - (currentRowWidth + scaledWidth);
      if (currentRow.length > 0 && (potentialGap > maxGapPerRow || currentRowWidth + scaledWidth > viewportWidth)) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }

      currentRow.push(img);
      currentRowWidth += scaledWidth;
    });

    // Add remaining images to the last row
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}