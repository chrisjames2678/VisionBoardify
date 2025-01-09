document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');
  const openOptionsButton = document.getElementById('openOptions');

  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; padding-top: 40vh; color: #666;">
      <p>Loading vision board...</p>
    </div>`;

  // Handle options button click
  openOptionsButton.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    } else {
      console.log('Running in development mode - options page not available');
    }
  });

  async function generateAndDisplayMosaic() {
    console.log('Starting mosaic generation...');

    let images;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      images = await StorageManager.getImages();
    } else {
      // Development mode: use test images
      images = Array(10).fill('https://picsum.photos/800/600');
    }

    console.log('Retrieved', images.length, 'images');

    if (images.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding-top: 40vh; color: #666;">
          <p>No images added yet.</p>
          <p>Click the settings button to configure your vision board.</p>
        </div>`;
      return;
    }

    try {
      // Create new canvas for the mosaic
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      // Generate new mosaic
      console.log('Starting mosaic generation with canvas size:', canvas.width, 'x', canvas.height);
      const mosaic = await MosaicGenerator.generate(images);

      // Fade out current content
      container.style.opacity = '0';

      // Wait for fade out
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear and add new canvas
      container.innerHTML = '';
      container.appendChild(canvas);

      // Draw mosaic and fade in
      const ctx = canvas.getContext('2d');
      ctx.putImageData(mosaic, 0, 0);
      console.log('Mosaic rendered successfully');

      // Cache the mosaic if in extension mode
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'SET_CACHED_MOSAIC',
          mosaic: canvas.toDataURL()
        });
      }

      // Fade in new mosaic
      container.style.opacity = '1';
    } catch (error) {
      console.error('Error generating mosaic:', error);
      container.innerHTML = `
        <div style="text-align: center; padding-top: 40vh; color: #666;">
          <p>Error generating mosaic. Please try refreshing the page.</p>
          <p>Error details: ${error.message}</p>
        </div>`;
    }
  }

  // Generate initial mosaic
  generateAndDisplayMosaic();

  // Regenerate on window resize (with debounce)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      console.log('Window resized, regenerating mosaic...');
      generateAndDisplayMosaic();
    }, 250);
  });

  // Load cached mosaic while generating new one (if in extension mode)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      chrome.runtime.sendMessage({ type: 'GET_CACHED_MOSAIC' }, response => {
        if (response && response.mosaic) {
          const img = new Image();
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = window.innerWidth;
            tempCanvas.height = window.innerHeight;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            container.appendChild(tempCanvas);
          };
          img.src = response.mosaic;
        }
      });
    } catch (error) {
      console.error('Error loading cached mosaic:', error);
    }
  }
});