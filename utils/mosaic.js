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

      // Return processed images with grid layout styling
      return validImages.map((img) => {
        return {
          ...img,
          style: {
            gridRow: 'span 1',
            gridColumn: 'span 1',
            width: '100%',
            height: '100%',
            position: 'relative',
            transition: 'transform 0.3s ease'
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