class MosaicGenerator {
  static async generate(images) {
    try {
      console.log('Processing', images.length, 'images for mosaic');

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
      validImages.sort((a, b) => a.aspectRatio - b.aspectRatio);

      // Calculate optimal row height based on viewport
      const viewportHeight = window.innerHeight;
      const optimalRows = Math.ceil(Math.sqrt(validImages.length));
      const baseRowHeight = Math.floor(viewportHeight / (optimalRows + 1));

      // Process images for enhanced grid layout
      return validImages.map((img, index) => {
        // Calculate position-based factors
        const isEdge = index === 0 || index === validImages.length - 1;
        const isCorner = isEdge && (index === 0 || index === validImages.length - 1);
        const isWide = img.aspectRatio > 1.5;
        const isNearAspectRatio = (prev, curr) => Math.abs(prev.aspectRatio - curr.aspectRatio) < 0.2;

        // Group similar aspect ratios
        const hasSimlarNeighbor = index > 0 && isNearAspectRatio(validImages[index - 1], img);

        // Calculate scale factor based on position and context
        const scaleFactor = isCorner ? 1.15 : (isEdge ? 1.1 : (isWide ? 1.05 : 1));

        // Adjust grid span based on image properties
        const gridSpan = isWide && !hasSimlarNeighbor ? 2 : 1;

        return {
          ...img,
          style: {
            gridRow: 'span 1',
            gridColumn: `span ${gridSpan}`,
            width: '100%',
            height: '100%',
            position: 'relative',
            transition: 'transform 0.3s ease, scale 0.3s ease',
            scale: scaleFactor,
            zIndex: isCorner ? 3 : (isEdge ? 2 : 1),
            objectFit: 'cover',
            aspectRatio: img.aspectRatio
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