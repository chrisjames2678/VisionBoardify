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
    console.log('Sorted images by area:', loadedImages.map(img => img.area));

    // Calculate optimal grid layout based on screen proportions
    const totalImages = loadedImages.length;
    const canvasAspectRatio = canvas.width / canvas.height;

    // Calculate weighted aspect ratio based on image areas
    const totalArea = loadedImages.reduce((sum, img) => sum + img.area, 0);
    const weightedAspectRatio = loadedImages.reduce(
      (sum, img) => sum + (img.aspectRatio * img.area / totalArea), 
      0
    );

    // Determine initial grid dimensions
    let cols = Math.round(Math.sqrt(totalImages * weightedAspectRatio));
    let rows = Math.ceil(totalImages / cols);

    // Adjust grid to better fill space
    const padding = 0.03; // 3% padding between images
    while (cols * rows < totalImages || (cols / rows) < canvasAspectRatio * 0.8) {
      if ((cols + 1) / rows < weightedAspectRatio * 1.2) {
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

    // Layout images with dynamic cell sizing
    let currentRow = 0;
    let currentCol = 0;

    for (let i = 0; i < loadedImages.length; i++) {
      const img = loadedImages[i];
      const nextImg = loadedImages[i + 1];
      const prevImg = loadedImages[i - 1];

      // Calculate dynamic cell size based on neighboring images
      let cellWidthAdjust = 1.0;
      let cellHeightAdjust = 1.0;

      // Adjust cell size based on image relationships
      if (nextImg && Math.abs(img.aspectRatio - nextImg.aspectRatio) < 0.2) {
        cellWidthAdjust = 1.1; // Slightly expand for similar aspect ratios
      }
      if (prevImg && Math.abs(img.aspectRatio - prevImg.aspectRatio) < 0.2) {
        cellHeightAdjust = 1.1; // Expand for vertical alignment
      }

      // Calculate padded cell dimensions
      const paddedWidth = cellWidth * (1 - padding) * cellWidthAdjust;
      const paddedHeight = cellHeight * (1 - padding) * cellHeightAdjust;

      // Calculate scale to fit image within padded cell while maintaining aspect ratio
      const scale = Math.min(
        paddedWidth / img.width,
        paddedHeight / img.height
      ) * 1.03; // Slight overlap to reduce visible gaps

      const width = img.width * scale;
      const height = img.height * scale;

      // Center image in cell
      const x = currentCol * cellWidth + (cellWidth - width) / 2;
      const y = currentRow * cellHeight + (cellHeight - height) / 2;

      console.log('Placing image', i, 'at', x, y, 'with dimensions', width, height);

      // Draw image with high quality
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { alpha: true });
      tempCanvas.width = width;
      tempCanvas.height = height;

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(img.element, 0, 0, width, height);

      // Draw final image
      ctx.drawImage(tempCanvas, x, y, width, height);

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