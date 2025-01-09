class MosaicGenerator {
  static async generate(images) {
    try {
      console.log('Processing', images.length, 'images for mosaic');

      // Calculate viewport constraints
      const viewportWidth = window.innerWidth - 32; // Account for container padding
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

      // Initialize row tracking
      const rows = [];
      let currentRow = [];
      let currentRowWidth = 0;

      // Process images
      validImages.forEach((img) => {
        // Calculate initial dimensions based on max constraints
        let imgHeight = maxImageHeight;
        let imgWidth = imgHeight * img.aspectRatio;

        // Adjust if width exceeds max
        if (imgWidth > maxImageWidth) {
          imgWidth = maxImageWidth;
          imgHeight = imgWidth / img.aspectRatio;
        }

        // Calculate maximum allowed gap (20% of viewport width)
        const maxGapWidth = viewportWidth * 0.2;

        // Check if adding this image would exceed width or gap constraints
        const potentialWidth = currentRowWidth + imgWidth;
        const estimatedGap = currentRow.length * 8; // 8px minimum gap
        const totalWidth = potentialWidth + estimatedGap;

        // Start new row if needed
        if (currentRow.length > 0 && (totalWidth > viewportWidth || 
            (viewportWidth - totalWidth) > maxGapWidth)) {

          // Scale current row to fit width
          const rowScale = Math.min(
            (viewportWidth - (currentRow.length - 1) * 8) / currentRowWidth,
            1
          );

          rows.push(...currentRow.map((item, i) => ({
            ...item,
            style: {
              width: `${item.width * rowScale}px`,
              height: `${item.height * rowScale}px`,
              flex: '1 1 auto',
              marginRight: i < currentRow.length - 1 ? '8px' : '0'
            },
            newRow: true
          })));

          currentRow = [];
          currentRowWidth = 0;
        }

        // Add image to current row
        currentRow.push({
          ...img,
          width: imgWidth,
          height: imgHeight,
          style: {
            width: `${imgWidth}px`,
            height: `${imgHeight}px`,
            flex: '1 1 auto',
            marginRight: '8px'
          }
        });

        currentRowWidth += imgWidth;
      });

      // Handle last row
      if (currentRow.length > 0) {
        const rowScale = Math.min(
          (viewportWidth - (currentRow.length - 1) * 8) / currentRowWidth,
          1
        );

        rows.push(...currentRow.map((item, i) => ({
          ...item,
          style: {
            width: `${item.width * rowScale}px`,
            height: `${item.height * rowScale}px`,
            flex: '1 1 auto',
            marginRight: i < currentRow.length - 1 ? '8px' : '0'
          },
          newRow: true
        })));
      }

      return rows;
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