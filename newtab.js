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

  async function displayMosaic() {
    try {
      // Get images
      let images;
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        images = await StorageManager.getImages();
      } else {
        // Development mode: use local test images
        images = [
          'attached_assets/Screenshot 2025-01-09 at 19.56.05.png',
          'attached_assets/Screenshot 2025-01-09 at 20.09.35.png',
          'attached_assets/Screenshot 2025-01-09 at 20.21.22.png',
          'attached_assets/Screenshot 2025-01-09 at 20.36.33.png'
        ];
      }

      // Show message if no images
      if (!images.length) {
        container.innerHTML = `
          <div style="text-align: center; padding-top: 40vh; color: #666;">
            <p>No images added yet.</p>
            <p>Click the settings button to configure your vision board.</p>
          </div>`;
        return;
      }

      // Process images through MosaicGenerator
      const processedImages = await MosaicGenerator.generate(images);

      // Clear container and create image rows
      container.innerHTML = '';

      let currentRow;
      processedImages.forEach((img, index) => {
        // Create new row if needed
        if (!currentRow || img.newRow) {
          currentRow = document.createElement('div');
          currentRow.className = 'mosaic-row';
          container.appendChild(currentRow);
        }

        const tile = document.createElement('div');
        tile.className = 'image-tile';
        Object.assign(tile.style, img.style);

        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.alt = `Vision ${index + 1}`;
        imgElement.loading = 'lazy';

        tile.appendChild(imgElement);
        currentRow.appendChild(tile);
      });

    } catch (error) {
      console.error('Error displaying mosaic:', error);
      container.innerHTML = `
        <div style="text-align: center; padding-top: 40vh; color: #666;">
          <p>Error displaying vision board.</p>
          <p>Please try refreshing the page.</p>
        </div>`;
    }
  }

  // Display initial mosaic
  await displayMosaic();

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(displayMosaic, 250);
  });
});