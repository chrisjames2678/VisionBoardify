class MosaicGenerator {
  static async generate(images) {
    console.log('Generating mosaic with', images.length, 'images');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true
    });

    // Set canvas size to match screen size with maximum possible resolution
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
      images.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              element: img,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height,
              area: img.width * img.height
            });
          };
          img.onerror = () => {
            console.error('Failed to load image:', src);
            reject(new Error('Image load failed'));
          };
          img.setAttribute('loading', 'eager');
          img.setAttribute('decoding', 'sync');
          img.src = src;
        });
      })
    );

    // Enhanced sorting with multi-factor weighting
    loadedImages.sort((a, b) => {
      const areaWeight = 0.85;       // Increased weight for area
      const aspectWeight = 0.15;     // Reduced weight for aspect ratio
      const areaDiff = b.area - a.area;
      const aspectDiff = Math.abs(1 - a.aspectRatio) - Math.abs(1 - b.aspectRatio);
      return areaWeight * areaDiff + aspectWeight * aspectDiff;
    });

    // Calculate optimal grid layout
    const totalImages = loadedImages.length;
    const canvasAspectRatio = canvas.width / canvas.height;

    // Dynamic padding calculation with aggressive reduction
    const basePadding = 0.012;  // Reduced to 1.2% base padding
    const padding = Math.max(0.004, basePadding * Math.pow(0.8, Math.floor(totalImages / 3)));

    // Calculate weighted aspect ratio for optimal grid
    const totalArea = loadedImages.reduce((sum, img) => sum + img.area, 0);
    const weightedAspectRatio = loadedImages.reduce(
      (sum, img) => sum + (img.aspectRatio * img.area / totalArea), 
      0
    );

    // Dynamic grid calculation with improved aspect ratio handling
    let cols = Math.round(Math.sqrt(totalImages * weightedAspectRatio * canvasAspectRatio));
    let rows = Math.ceil(totalImages / cols);

    // Optimize grid dimensions for minimal waste
    const targetRatio = canvasAspectRatio * 0.99; // Increased from 0.98 for even better coverage
    while ((cols / rows < targetRatio && cols < totalImages) || 
           (cols * rows < totalImages)) {
      if (cols / rows < targetRatio) {
        cols++;
      } else {
        rows++;
      }
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

    for (let i = 0; i < loadedImages.length; i++) {
      const img = loadedImages[i];
      const nextImg = loadedImages[i + 1];
      const prevImg = loadedImages[i - 1];

      // Enhanced cell size adjustments with progressive scaling
      const emptyColFactor = colWidths[currentCol] === 0 ? 0.25 : 0.15;
      const emptyRowFactor = rowHeights[currentRow] === 0 ? 0.25 : 0.15;

      const cellWidthAdjust = Math.min(1.3, 1 + emptyColFactor);
      const cellHeightAdjust = Math.min(1.3, 1 + emptyRowFactor);

      // Adjust for similar aspect ratios with increased effect
      if (nextImg && Math.abs(img.aspectRatio - nextImg.aspectRatio) < 0.2) {
        const similarityFactor = 1.2;
        cellWidthAdjust *= similarityFactor;
      }
      if (prevImg && Math.abs(img.aspectRatio - prevImg.aspectRatio) < 0.2) {
        const similarityFactor = 1.2;
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
      const overlapFactor = 1.12 - (currentRow + currentCol) / (rows + cols) * 0.04;
      const scale = baseScale * overlapFactor;

      const width = img.width * scale;
      const height = img.height * scale;

      // Update row and column tracking
      rowHeights[currentRow] = Math.max(rowHeights[currentRow], height);
      colWidths[currentCol] = Math.max(colWidths[currentCol], width);

      // Position image with optimal offset
      const xOffset = (cellWidth - width) / 2 * (1 - padding);
      const yOffset = (cellHeight - height) / 2 * (1 - padding);
      const x = currentCol * cellWidth + xOffset;
      const y = currentRow * cellHeight + yOffset;

      // Draw with high quality
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { alpha: true });
      tempCanvas.width = width;
      tempCanvas.height = height;

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(img.element, 0, 0, width, height);

      // Draw final image
      ctx.drawImage(tempCanvas, x, y, width, height);

      // Move to next position
      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;
      }
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}