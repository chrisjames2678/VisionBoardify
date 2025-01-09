class MosaicGenerator {
  static async generate(images) {
    try {
      console.log('Generating mosaic with', images.length, 'images');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {
        alpha: true,
        willReadFrequently: true
      });

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas size with device pixel ratio
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

      // Screen border padding (6% of smallest dimension)
      const borderPadding = Math.min(canvas.width, canvas.height) * 0.06;

      // Load and analyze images
      const loadedImages = await Promise.all(
        images.map(async (src, index) => {
          try {
            const img = await new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                console.log(`Image ${index + 1}/${images.length} loaded successfully`);
                resolve({
                  element: img,
                  width: img.width,
                  height: img.height,
                  aspectRatio: img.width / img.height,
                  area: img.width * img.height
                });
              };
              img.onerror = () => reject(new Error(`Image ${index + 1} load failed`));
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

      // Available space for layout
      const availableWidth = canvas.width - (borderPadding * 2);
      const availableHeight = canvas.height - (borderPadding * 2);

      // Clear canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate optimal grid dimensions based on number of images
      const numImages = validImages.length;
      const aspectRatio = availableWidth / availableHeight;
      const gridRows = Math.ceil(Math.sqrt(numImages / aspectRatio));
      const gridCols = Math.ceil(numImages / gridRows);

      // Calculate cell size with significant overlap
      const cellWidth = (availableWidth / (gridCols - 0.7)); // Increased overlap between columns
      const cellHeight = (availableHeight / (gridRows - 0.7)); // Increased overlap between rows

      // Generate positions with enhanced clustering
      const positions = [];
      validImages.forEach((img, index) => {
        // Determine grid position
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;

        // Calculate base position with reduced spacing
        const baseX = borderPadding + (col * cellWidth * 0.65) + (cellWidth / 2);
        const baseY = borderPadding + (row * cellHeight * 0.65) + (cellHeight / 2);

        // Add random offset (±50% of cell size)
        const offsetX = (Math.random() * 1.0 - 0.5) * cellWidth;
        const offsetY = (Math.random() * 1.0 - 0.5) * cellHeight;

        // Calculate base scale to fit in cell with larger sizes
        const maxScale = Math.min(
          (cellWidth * 1.5) / img.width,  // Allow 50% overflow
          (cellHeight * 1.5) / img.height
        );

        // Vary scale based on position and index
        const isFeature = index < 3;
        const baseScale = maxScale * (isFeature ? 1.2 : 1.0);

        // Add random variation to scale (±20%)
        const finalScale = baseScale * (0.8 + Math.random() * 0.4);

        // Calculate final position with offset
        let x = baseX + offsetX;
        let y = baseY + offsetY;

        // Ensure image stays within borders
        const width = img.width * finalScale;
        const height = img.height * finalScale;
        x = Math.min(Math.max(x, borderPadding + width/2), canvas.width - width/2 - borderPadding);
        y = Math.min(Math.max(y, borderPadding + height/2), canvas.height - height/2 - borderPadding);

        positions.push({ x, y, scale: finalScale });
        console.log(`Position calculated for image ${index + 1}: (${x.toFixed(0)}, ${y.toFixed(0)}), scale: ${finalScale.toFixed(2)}`);
      });

      // Draw images with optimized order (outer to inner)
      const drawOrder = positions.map((pos, index) => ({ index, pos }))
        .sort((a, b) => {
          const aDist = Math.abs(a.pos.x - canvas.width/2) + Math.abs(a.pos.y - canvas.height/2);
          const bDist = Math.abs(b.pos.x - canvas.width/2) + Math.abs(b.pos.y - canvas.height/2);
          return bDist - aDist; // Draw outer images first
        });

      drawOrder.forEach(({ index, pos }) => {
        const img = validImages[index];
        const width = img.width * pos.scale;
        const height = img.height * pos.scale;

        console.log(`Drawing image ${index + 1} at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}), size: ${width.toFixed(0)}x${height.toFixed(0)}`);

        try {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img.element, pos.x - width/2, pos.y - height/2, width, height);
          ctx.restore();
        } catch (error) {
          console.error(`Error drawing image ${index + 1}:`, error);
        }
      });

      console.log('Mosaic generation completed');
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error in mosaic generation:', error);
      throw error;
    }
  }

  // Test function for local development
  static testMosaic(numImages = 10) {
    const testUrls = [
      'https://picsum.photos/800/600',
      'https://picsum.photos/600/800',
      'https://picsum.photos/1024/768',
      'https://picsum.photos/768/1024',
    ];

    const testImages = Array(numImages).fill(null).map((_, i) =>
      testUrls[i % testUrls.length]
    );

    console.log('Starting test with images:', testImages);
    return this.generate(testImages);
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}