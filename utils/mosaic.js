class MosaicGenerator {
  static async generate(images) {
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

    // Sort images by area to optimize layout (larger images first)
    loadedImages.sort((a, b) => b.area - a.area);

    // Calculate optimal grid layout based on screen proportions
    const totalImages = loadedImages.length;
    const canvasAspectRatio = canvas.width / canvas.height;

    // Calculate weighted aspect ratio based on image areas
    const totalArea = loadedImages.reduce((sum, img) => sum + img.area, 0);
    const weightedAspectRatio = loadedImages.reduce(
      (sum, img) => sum + (img.aspectRatio * img.area / totalArea), 
      0
    );

    // Determine optimal grid dimensions using weighted aspect ratio
    let cols = Math.round(Math.sqrt(totalImages * weightedAspectRatio / canvasAspectRatio));
    let rows = Math.ceil(totalImages / cols);

    // Adjust grid to minimize empty space
    while (cols * rows < totalImages) {
      if ((cols + 1) / rows < weightedAspectRatio) {
        cols++;
      } else {
        rows++;
      }
    }

    // Calculate base cell dimensions
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layout images with dynamic cell sizing and overlap
    let currentRow = 0;
    let currentCol = 0;

    for (let i = 0; i < loadedImages.length; i++) {
      const img = loadedImages[i];

      // Calculate cell size adjustments based on neighboring images
      const nextImg = loadedImages[i + 1];
      const prevImg = loadedImages[i - 1];

      // Adjust cell dimensions based on image aspect ratio and position
      let adjustedCellWidth = cellWidth;
      let adjustedCellHeight = cellHeight;

      // Expand width for similar aspect ratios
      if (nextImg && Math.abs(img.aspectRatio - nextImg.aspectRatio) < 0.2) {
        adjustedCellWidth *= 1.2; // More aggressive expansion
      }

      // Expand height for vertical alignment
      if (prevImg && currentCol > 0 && Math.abs(img.aspectRatio - prevImg.aspectRatio) < 0.2) {
        adjustedCellHeight *= 1.2;
      }

      // Add extra expansion for edge cells to ensure full coverage
      if (currentCol === 0 || currentCol === cols - 1) {
        adjustedCellWidth *= 1.1;
      }
      if (currentRow === 0 || currentRow === rows - 1) {
        adjustedCellHeight *= 1.1;
      }

      // Calculate dimensions to completely fill adjusted cell with overlap
      const scale = Math.max(
        adjustedCellWidth / img.width,
        adjustedCellHeight / img.height
      ) * 1.2; // Increased overlap for better coverage

      const width = img.width * scale;
      const height = img.height * scale;

      // Position image with overlap
      const x = currentCol * cellWidth - (width - cellWidth) * 0.1; // Add negative margin
      const y = currentRow * cellHeight - (height - cellHeight) * 0.1;

      // Draw image with high quality and centered positioning
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { alpha: true });
      tempCanvas.width = width;
      tempCanvas.height = height;

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(img.element, 0, 0, width, height);

      // Center image in cell with negative margins to create overlap
      const drawX = x + (cellWidth - width) / 2;
      const drawY = y + (cellHeight - height) / 2;
      ctx.drawImage(tempCanvas, drawX, drawY);

      // Move to next cell
      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;
      }
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}