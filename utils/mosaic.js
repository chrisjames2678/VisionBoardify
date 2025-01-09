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

      // Set canvas size with device pixel ratio for better quality
      const maxDimension = 16384;
      const pixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.innerWidth * pixelRatio;
      const screenHeight = window.innerHeight * pixelRatio;

      const scale = Math.min(
        maxDimension / screenWidth,
        maxDimension / screenHeight,
        2
      );

      canvas.width = screenWidth * scale;
      canvas.height = screenHeight * scale;
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
                  aspectRatio: img.width / img.height,
                  area: img.width * img.height
                });
              };

              img.onerror = () => {
                console.error(`Failed to load image ${index + 1}:`, src);
                reject(new Error(`Image ${index + 1} load failed`));
              };

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

      // Sort images by area and aspect ratio for optimal layout
      validImages.sort((a, b) => {
        const areaWeight = 0.7;
        const aspectWeight = 0.3;
        const areaDiff = b.area - a.area;
        const aspectDiff = Math.abs(1 - a.aspectRatio) - Math.abs(1 - b.aspectRatio);
        return areaWeight * areaDiff + aspectWeight * aspectDiff;
      });

      // Calculate grid dimensions
      const totalImages = validImages.length;
      const canvasAspectRatio = canvas.width / canvas.height;

      // Dynamic gap calculation based on image count
      const baseGap = Math.max(0.001, 0.01 / Math.sqrt(totalImages));
      const padding = baseGap;

      // Calculate weighted aspect ratio for optimal grid
      const totalArea = validImages.reduce((sum, img) => sum + img.area, 0);
      const weightedAspectRatio = validImages.reduce(
        (sum, img) => sum + (img.aspectRatio * img.area / totalArea),
        0
      );

      // Optimize grid dimensions
      let cols = Math.round(Math.sqrt(totalImages * weightedAspectRatio * canvasAspectRatio));
      let rows = Math.ceil(totalImages / cols);

      // Adjust grid for better aspect ratio match
      while ((cols / rows < canvasAspectRatio * 0.95 && cols < totalImages) || 
             (cols * rows < totalImages)) {
        cols++;
        rows = Math.ceil(totalImages / cols);
      }

      console.log('Grid layout:', cols, 'x', rows, 'for', totalImages, 'images');

      // Calculate cell dimensions
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      // Initialize tracking arrays for dynamic spacing
      const rowHeights = new Array(rows).fill(0);
      const colWidths = new Array(cols).fill(0);

      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentRow = 0;
      let currentCol = 0;

      // Layout images with adaptive scaling
      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i];
        const nextImg = validImages[i + 1];
        const prevImg = validImages[i - 1];

        // Calculate dynamic scale factors
        const scaleBase = 1.2;
        const neighborBonus = 0.15;
        let scaleMultiplier = scaleBase;

        // Increase scale for similar aspect ratios
        if (nextImg && Math.abs(img.aspectRatio - nextImg.aspectRatio) < 0.2) {
          scaleMultiplier += neighborBonus;
        }
        if (prevImg && Math.abs(img.aspectRatio - prevImg.aspectRatio) < 0.2) {
          scaleMultiplier += neighborBonus;
        }

        // Calculate dimensions with minimal gaps
        const paddedWidth = cellWidth * (1 - padding) * scaleMultiplier;
        const paddedHeight = cellHeight * (1 - padding) * scaleMultiplier;

        // Scale image while maintaining aspect ratio
        const scale = Math.min(
          paddedWidth / img.width,
          paddedHeight / img.height
        );

        const width = img.width * scale;
        const height = img.height * scale;

        // Update row and column tracking
        rowHeights[currentRow] = Math.max(rowHeights[currentRow], height);
        colWidths[currentCol] = Math.max(colWidths[currentCol], width);

        // Calculate optimal position with minimal gaps
        const xOffset = (cellWidth - width) / 2 * (1 - padding);
        const yOffset = (cellHeight - height) / 2 * (1 - padding);
        const x = currentCol * cellWidth + xOffset;
        const y = currentRow * cellHeight + yOffset;

        try {
          // Draw image with high quality
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img.element, x, y, width, height);
          ctx.restore();
        } catch (drawError) {
          console.error('Error drawing image:', drawError);
          continue;
        }

        // Move to next position
        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
        }
      }

      console.log('Mosaic generation completed successfully');
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error in mosaic generation:', error);
      throw error;
    }
  }
}

// Add test function for local development
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