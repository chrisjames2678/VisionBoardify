class MosaicGenerator {
  static async generate(images) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true
    });

    // Set canvas size to match screen size with maximum possible resolution
    const maxDimension = 16384; // Maximum canvas dimension supported by most browsers
    const pixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth * pixelRatio;
    const screenHeight = window.innerHeight * pixelRatio;

    // Use the highest possible resolution while staying within browser limits
    const scale = Math.min(
      maxDimension / screenWidth,
      maxDimension / screenHeight,
      2 // Cap at 2x screen resolution to prevent memory issues
    );

    canvas.width = screenWidth * scale;
    canvas.height = screenHeight * scale;

    // Configure for maximum quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate grid layout
    const totalImages = images.length;
    const aspectRatio = canvas.width / canvas.height;
    let cols = Math.ceil(Math.sqrt(totalImages * aspectRatio));
    let rows = Math.ceil(totalImages / cols);

    while (cols * rows < totalImages) {
      cols++;
    }

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    // Load images at maximum quality
    const loadedImages = await Promise.all(
      images.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();

          img.onload = () => {
            // Calculate scaling to fit cell while maintaining aspect ratio
            const scale = Math.min(
              cellWidth / img.width,
              cellHeight / img.height
            );

            // Never scale up images beyond their original size
            const finalScale = Math.min(1, scale);

            const width = Math.round(img.width * finalScale);
            const height = Math.round(img.height * finalScale);

            resolve({
              element: img,
              width,
              height,
              originalWidth: img.width,
              originalHeight: img.height
            });
          };

          img.onerror = () => {
            console.error('Failed to load image:', src);
            reject(new Error('Image load failed'));
          };

          // Set image to load at maximum quality
          img.setAttribute('loading', 'eager');
          img.setAttribute('decoding', 'sync');
          img.src = src;
        });
      })
    );

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw images at their optimal size
    let imageIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (imageIndex >= loadedImages.length) break;

        const img = loadedImages[imageIndex];

        // Center image in cell
        const x = Math.round(col * cellWidth + (cellWidth - img.width) / 2);
        const y = Math.round(row * cellHeight + (cellHeight - img.height) / 2);

        // Create temporary canvas for high-quality rendering
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { alpha: true });
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        // Draw image to temp canvas first for better quality
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(img.element, 0, 0, img.width, img.height);

        // Draw final image from temp canvas
        ctx.drawImage(tempCanvas, x, y);

        imageIndex++;
      }
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}