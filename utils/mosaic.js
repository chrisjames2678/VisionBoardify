class MosaicGenerator {
  static async generate(images) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to match screen size
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;

    // Calculate optimal grid dimensions
    const totalImages = images.length;
    const aspectRatio = window.innerWidth / window.innerHeight;
    let cols = Math.ceil(Math.sqrt(totalImages * aspectRatio));
    let rows = Math.ceil(totalImages / cols);

    // Ensure we have enough cells for all images
    while (cols * rows < totalImages) {
      cols++;
    }

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    // Create temporary canvas for image processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = cellWidth;
    tempCanvas.height = cellHeight;

    // Shuffle images for random placement
    const shuffledImages = [...images].sort(() => Math.random() - 0.5);

    // Load and process all images
    const loadedImages = await Promise.all(
      shuffledImages.map(src => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            // Process image in temp canvas
            tempCtx.clearRect(0, 0, cellWidth, cellHeight);

            // Calculate scaling to maintain aspect ratio
            const scale = Math.max(
              cellWidth / img.width,
              cellHeight / img.height
            );

            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // Center the image in the cell
            const x = (cellWidth - scaledWidth) / 2;
            const y = (cellHeight - scaledHeight) / 2;

            // Draw and process image
            tempCtx.drawImage(img, x, y, scaledWidth, scaledHeight);

            // Apply subtle effects
            tempCtx.globalAlpha = 0.9;

            resolve({
              element: img,
              processedData: tempCtx.getImageData(0, 0, cellWidth, cellHeight)
            });
          };
          img.src = src;
        });
      })
    );

    // Draw processed images in grid
    let imageIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (imageIndex >= loadedImages.length) break;

        const x = col * cellWidth;
        const y = row * cellHeight;

        // Draw processed image data
        ctx.putImageData(loadedImages[imageIndex].processedData, x, y);
        imageIndex++;
      }
    }

    // Apply post-processing effects
    ctx.filter = 'blur(2px)';
    ctx.globalAlpha = 0.8;
    ctx.drawImage(canvas, 0, 0);

    // Reset filters
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}