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
                  aspectRatio: img.width / img.height
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

      // Simple grid calculation
      const imageCount = validImages.length;
      console.log('Total valid images:', imageCount);

      // Start with minimum 3 columns for better distribution
      let cols = Math.max(3, Math.floor(Math.sqrt(imageCount)));
      let rows = Math.ceil(imageCount / cols);

      // Adjust grid based on screen aspect ratio
      const screenAspect = canvas.width / canvas.height;
      if (screenAspect > 1.5) {
        // Wide screen - prefer more columns
        cols = Math.min(imageCount, cols + 1);
      } else if (screenAspect < 0.67) {
        // Tall screen - prefer more rows
        rows = Math.min(imageCount, rows + 1);
      }

      // Ensure we have enough cells
      while (cols * rows < imageCount) {
        if ((cols + 1) * rows <= imageCount * 1.2) {
          cols++;
        } else {
          rows++;
        }
      }

      console.log('Grid dimensions:', cols, 'x', rows);

      // Calculate cell dimensions
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      // Fixed spacing (3% of cell size)
      const spacing = Math.min(cellWidth, cellHeight) * 0.03;

      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw images
      let currentRow = 0;
      let currentCol = 0;

      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i];

        // Calculate available space in cell
        const availWidth = cellWidth - (spacing * 2);
        const availHeight = cellHeight - (spacing * 2);

        // Scale image to fit cell while maintaining aspect ratio
        const scale = Math.min(
          availWidth / img.width,
          availHeight / img.height
        );

        const width = img.width * scale;
        const height = img.height * scale;

        // Center image in cell
        const x = (currentCol * cellWidth) + ((cellWidth - width) / 2);
        const y = (currentRow * cellHeight) + ((cellHeight - height) / 2);

        console.log(`Drawing image ${i + 1} at position (${currentCol}, ${currentRow}), size: ${width.toFixed(0)}x${height.toFixed(0)}`);

        try {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img.element, x, y, width, height);
          ctx.restore();
        } catch (error) {
          console.error(`Error drawing image ${i + 1}:`, error);
          continue;
        }

        // Move to next position
        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
        }
      }

      console.log('Mosaic generation completed');
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error in mosaic generation:', error);
      throw error;
    }
  }
}

// Test function for local development
if (typeof chrome === 'undefined') {
  console.log('Running in development mode');
  window.testMosaic = async function(numImages = 10) {
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
    const result = await MosaicGenerator.generate(testImages);
    console.log('Test mosaic generated successfully');
    return result;
  };
}