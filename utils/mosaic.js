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

      // Set canvas size to match screen size with maximum possible resolution
      const maxDimension = 16384; // Maximum canvas size supported by most browsers
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

      // Load and analyze images with better error handling
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

              img.setAttribute('loading', 'eager');
              img.setAttribute('decoding', 'sync');
              img.src = src;
            });
            return img;
          } catch (error) {
            console.warn(`Skipping image ${index + 1} due to load error:`, error.message);
            return {
              element: createPlaceholderImage(400, 300),
              width: 400,
              height: 300,
              aspectRatio: 4/3,
              area: 120000
            };
          }
        })
      );

      // Filter out any failed images
      const validImages = loadedImages.filter(img => img && img.element);
      if (validImages.length === 0) {
        throw new Error('No valid images to display');
      }

      // Enhanced sorting with multi-factor weighting
      validImages.sort((a, b) => {
        const areaWeight = 0.85;
        const aspectWeight = 0.15;
        const areaDiff = b.area - a.area;
        const aspectDiff = Math.abs(1 - a.aspectRatio) - Math.abs(1 - b.aspectRatio);
        return areaWeight * areaDiff + aspectWeight * aspectDiff;
      });

      // Calculate optimal grid layout
      const totalImages = validImages.length;
      const canvasAspectRatio = canvas.width / canvas.height;

      // Dynamic padding calculation with aggressive reduction
      const basePadding = 0.006; // Further reduced base padding to 0.6%
      const padding = Math.max(0.002, basePadding * Math.pow(0.75, Math.floor(totalImages / 3)));

      // Calculate weighted aspect ratio for optimal grid
      const totalArea = validImages.reduce((sum, img) => sum + img.area, 0);
      const weightedAspectRatio = validImages.reduce(
        (sum, img) => sum + (img.aspectRatio * img.area / totalArea),
        0
      );

      // Dynamic grid calculation with improved aspect ratio handling
      let cols = Math.round(Math.sqrt(totalImages * weightedAspectRatio * canvasAspectRatio));
      let rows = Math.ceil(totalImages / cols);

      // Optimize grid dimensions for minimal waste
      const targetRatio = canvasAspectRatio * 0.998;
      while ((cols / rows < targetRatio && cols < totalImages) || 
             (cols * rows < totalImages)) {
        cols++;
        rows = Math.ceil(totalImages / cols);
      }

      console.log('Grid layout:', cols, 'x', rows, 'for', totalImages, 'images');

      // Calculate base cell dimensions
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Layout images with enhanced gap filling
      let currentRow = 0;
      let currentCol = 0;
      let rowHeights = new Array(rows).fill(0);
      let colWidths = new Array(cols).fill(0);

      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i];
        const nextImg = validImages[i + 1];
        const prevImg = validImages[i - 1];

        // Enhanced cell size adjustments with progressive scaling
        const emptyColFactor = colWidths[currentCol] === 0 ? 0.35 : 0.25;
        const emptyRowFactor = rowHeights[currentRow] === 0 ? 0.35 : 0.25;

        const cellWidthAdjust = Math.min(1.5, 1 + emptyColFactor);
        const cellHeightAdjust = Math.min(1.5, 1 + emptyRowFactor);

        // Adjust for similar aspect ratios with increased effect
        if (nextImg && Math.abs(img.aspectRatio - nextImg.aspectRatio) < 0.2) {
          const similarityFactor = 1.3;
          cellWidthAdjust *= similarityFactor;
        }
        if (prevImg && Math.abs(img.aspectRatio - prevImg.aspectRatio) < 0.2) {
          const similarityFactor = 1.3;
          cellHeightAdjust *= similarityFactor;
        }

        // Calculate optimal dimensions with minimal padding
        const paddedWidth = cellWidth * (1 - padding) * cellWidthAdjust;
        const paddedHeight = cellHeight * (1 - padding) * cellHeightAdjust;

        // Scale image with adaptive overlap
        const baseScale = Math.min(
          paddedWidth / img.width,
          paddedHeight / img.height
        );

        // Apply progressive overlap based on position
        const overlapFactor = 1.2 - (currentRow + currentCol) / (rows + cols) * 0.05;
        const scale = baseScale * overlapFactor;

        const width = img.width * scale;
        const height = img.height * scale;

        // Update row and column tracking
        rowHeights[currentRow] = Math.max(rowHeights[currentRow], height);
        colWidths[currentCol] = Math.max(colWidths[currentCol], width);

        // Position image with optimal offset and increased overlap
        const xOffset = (cellWidth - width) / 2 * (1 - padding * 1.5);
        const yOffset = (cellHeight - height) / 2 * (1 - padding * 1.5);
        const x = currentCol * cellWidth + xOffset;
        const y = currentRow * cellHeight + yOffset;

        try {
          // Draw with high quality
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d', { alpha: true });
          if (!tempCtx) {
            throw new Error('Failed to get temporary canvas context');
          }

          tempCanvas.width = width;
          tempCanvas.height = height;

          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';
          tempCtx.drawImage(img.element, 0, 0, width, height);

          // Draw final image
          ctx.drawImage(tempCanvas, x, y, width, height);
        } catch (drawError) {
          console.error('Error drawing image:', drawError);
          continue; // Skip this image but continue with others
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

// Helper function to create placeholder images
function createPlaceholderImage(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Create a gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add placeholder text
  ctx.fillStyle = '#999';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Image Load Failed', width/2, height/2);

  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// Add test function for local development
if (typeof chrome === 'undefined') {
  console.log('Running in development mode');
  window.testMosaic = async function(numImages = 10) {
    // Use a mix of different image sizes for better testing
    const testUrls = [
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/600x800',
      'https://via.placeholder.com/1024x768',
      'https://via.placeholder.com/768x1024',
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