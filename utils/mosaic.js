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

      // Screen border padding (7% of smallest dimension)
      const borderPadding = Math.min(canvas.width, canvas.height) * 0.07;

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

      // Available space for layout
      const availableWidth = canvas.width - (borderPadding * 2);
      const availableHeight = canvas.height - (borderPadding * 2);

      // Clear canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Define zones for image placement (3x3 grid)
      const zones = [];
      const zoneWidth = availableWidth / 3;
      const zoneHeight = availableHeight / 3;

      // Create 9 zones with their centers
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          zones.push({
            x: borderPadding + (col * zoneWidth) + (zoneWidth / 2),
            y: borderPadding + (row * zoneHeight) + (zoneHeight / 2)
          });
        }
      }

      // Shuffle zones for random distribution
      zones.sort(() => Math.random() - 0.5);

      // Calculate positions for each image
      const positions = [];
      validImages.forEach((img, index) => {
        const zone = zones[index % zones.length];

        // Calculate base scale (larger for featured images)
        const baseScale = index < 3 ? 0.8 : 0.6;

        // Add random variation to scale (±15%)
        const randomScale = baseScale * (1 + (Math.random() * 0.3 - 0.15));

        // Calculate max scale to fit in zone
        const maxScale = Math.min(
          (zoneWidth * 1.2) / img.width,
          (zoneHeight * 1.2) / img.height
        );

        const finalScale = maxScale * randomScale;

        // Calculate dimensions
        const width = img.width * finalScale;
        const height = img.height * finalScale;

        // Add random offset within zone (±20% of zone size)
        const offsetX = (Math.random() * 0.4 - 0.2) * zoneWidth;
        const offsetY = (Math.random() * 0.4 - 0.2) * zoneHeight;

        // Calculate final position
        let x = zone.x + offsetX;
        let y = zone.y + offsetY;

        // Ensure image stays within borders
        x = Math.min(Math.max(x, borderPadding + width/2), canvas.width - width/2 - borderPadding);
        y = Math.min(Math.max(y, borderPadding + height/2), canvas.height - height/2 - borderPadding);

        positions.push({ x, y, scale: finalScale });
        console.log(`Position calculated for image ${index + 1}: (${x.toFixed(0)}, ${y.toFixed(0)}), scale: ${finalScale.toFixed(2)}`);
      });

      // Draw images in reverse order (so first images appear on top)
      for (let i = validImages.length - 1; i >= 0; i--) {
        const img = validImages[i];
        const pos = positions[i];
        const width = img.width * pos.scale;
        const height = img.height * pos.scale;

        console.log(`Drawing image ${i + 1} at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}), size: ${width.toFixed(0)}x${height.toFixed(0)}`);

        try {
          ctx.save();
          // Enable high-quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image with correct centering
          ctx.drawImage(img.element, pos.x - width/2, pos.y - height/2, width, height);
          ctx.restore();
        } catch (error) {
          console.error(`Error drawing image ${i + 1}:`, error);
        }
      }

      console.log('Mosaic generation completed');
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error in mosaic generation:', error);
      throw error;
    }
  }

  // Test function for local development
  static testMosaic(numImages = 10) {
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
    return this.generate(testImages);
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MosaicGenerator;
}