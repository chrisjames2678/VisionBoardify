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

      // Screen border padding (5% of smallest dimension)
      const borderPadding = Math.min(canvas.width, canvas.height) * 0.05;

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

      // Sort images by aspect ratio for better clustering
      validImages.sort((a, b) => a.aspectRatio - b.aspectRatio);

      // Available space for layout
      const availableWidth = canvas.width - (borderPadding * 2);
      const availableHeight = canvas.height - (borderPadding * 2);

      // Clear canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // For 8 images, use a 3x3 grid (9 slots) for better distribution
      let gridRows = 3;
      let gridCols = 3;

      // Calculate cell size with maximum overlap
      const cellWidth = (availableWidth / (gridCols - 0.95));
      const cellHeight = (availableHeight / (gridRows - 0.95));

      // Generate positions with enhanced clustering
      const positions = [];
      validImages.forEach((img, index) => {
        // Determine grid position with aspect ratio consideration
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;

        // Calculate base position with minimal spacing
        const baseX = borderPadding + (col * cellWidth * 0.35) + (cellWidth / 2);
        const baseY = borderPadding + (row * cellHeight * 0.35) + (cellHeight / 2);

        // Calculate offset based on neighboring images
        const neighborPositions = positions.slice(-4);
        let offsetX = 0;
        let offsetY = 0;

        if (neighborPositions.length > 0) {
          // Average distance to recent neighbors
          const avgX = neighborPositions.reduce((sum, pos) => sum + pos.x, 0) / neighborPositions.length;
          const avgY = neighborPositions.reduce((sum, pos) => sum + pos.y, 0) / neighborPositions.length;

          // Add offset away from average position (creates natural spacing)
          offsetX = (baseX - avgX) * 0.3;
          offsetY = (baseY - avgY) * 0.3;
        }

        // Add controlled random variation
        offsetX += (Math.random() * 0.5 - 0.25) * cellWidth;
        offsetY += (Math.random() * 0.5 - 0.25) * cellHeight;

        // Calculate optimal scale based on position and neighbors
        const maxScale = Math.min(
          (cellWidth * 1.8) / img.width,
          (cellHeight * 1.8) / img.height
        );

        // Vary scale based on position and aspect ratio
        const isFeature = index < 3;
        const similarAspectRatio = index > 0 && 
          Math.abs(img.aspectRatio - validImages[index-1].aspectRatio) < 0.2;

        let baseScale = maxScale * (isFeature ? 1.2 : 1.0);
        if (similarAspectRatio) baseScale *= 1.15;

        // Ensure minimum scale for visibility
        const finalScale = Math.max(
          baseScale * (0.95 + Math.random() * 0.2),
          maxScale * 0.9
        );

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
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}
