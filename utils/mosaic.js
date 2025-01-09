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

      // Screen border padding (3% of smallest dimension)
      const borderPadding = Math.min(canvas.width, canvas.height) * 0.03;

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

      // Use a 3x3 grid with high overlap for tight packing
      const gridRows = 3;
      const gridCols = 3;

      // Calculate base cell size with maximum overlap
      const cellWidth = availableWidth / (gridCols - 0.85);  // Increased overlap
      const cellHeight = availableHeight / (gridRows - 0.85); // Increased overlap

      // Generate positions with enhanced clustering
      const positions = [];
      validImages.forEach((img, index) => {
        // Determine grid position with aspect ratio consideration
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;

        // Calculate base position with minimal spacing
        const baseX = borderPadding + (col * cellWidth * 0.35); // Tighter spacing
        const baseY = borderPadding + (row * cellHeight * 0.35); // Tighter spacing

        // Add controlled random variation for natural layout
        const offsetX = (Math.random() * 0.5) * cellWidth;
        const offsetY = (Math.random() * 0.5) * cellHeight;

        // Calculate optimal scale based on position
        const maxScale = Math.min(
          (cellWidth * 1.8) / img.width,   // Increased max scale
          (cellHeight * 1.8) / img.height  // for better coverage
        );

        // Scale adjustment factors
        const isEdge = row === 0 || row === gridRows - 1 || col === 0 || col === gridCols - 1;
        const isCorner = (row === 0 || row === gridRows - 1) && (col === 0 || col === gridCols - 1);

        // Adjust scaling based on position
        let scaleAdjustment = 1.0;
        if (isCorner) scaleAdjustment = 1.4; // Larger corner images
        else if (isEdge) scaleAdjustment = 1.3; // Larger edge images

        // Final scale calculation with minimal randomness
        const finalScale = maxScale * scaleAdjustment * (0.98 + Math.random() * 0.04);

        // Calculate dimensions
        const width = img.width * finalScale;
        const height = img.height * finalScale;

        // Center position in cell with offset
        const x = baseX + (cellWidth - width) / 2 + offsetX;
        const y = baseY + (cellHeight - height) / 2 + offsetY;

        // Ensure image stays within borders
        const constrainedX = Math.min(Math.max(x, borderPadding), canvas.width - width - borderPadding);
        const constrainedY = Math.min(Math.max(y, borderPadding), canvas.height - height - borderPadding);

        positions.push({ x: constrainedX, y: constrainedY, scale: finalScale });
      });

      // Draw images in optimal order (back to front)
      positions.forEach((pos, index) => {
        const img = validImages[index];
        const width = img.width * pos.scale;
        const height = img.height * pos.scale;

        try {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img.element, pos.x, pos.y, width, height);
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