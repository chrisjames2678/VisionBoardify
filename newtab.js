document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');
  const openOptionsButton = document.getElementById('openOptions');

  // Handle options button click
  openOptionsButton.addEventListener('click', () => {
    if (chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  async function displayImages() {
    try {
      // Get images from storage
      const images = await StorageManager.getImages();

      // Show message if no images
      if (!images || images.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <p>No images added yet.</p>
            <p>Click the ⚙️ button to configure your vision board.</p>
          </div>`;
        return;
      }

      // Clear container
      container.innerHTML = '';

      // Create image tiles with clean layout
      images.forEach((imageUrl, index) => {
        const tile = document.createElement('div');
        tile.className = 'image-tile';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Vision board image ${index + 1}`;
        img.loading = 'lazy';

        // Handle image load errors
        img.onerror = () => {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666"%3EError%3C/text%3E%3C/svg%3E';
          img.alt = 'Failed to load image';
        };

        tile.appendChild(img);
        container.appendChild(tile);
      });

    } catch (error) {
      console.error('Error displaying images:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>Error loading images.</p>
          <p>Please try refreshing the page.</p>
        </div>`;
    }
  }

  // Display initial images
  await displayImages();

  // Handle window resize with debouncing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(displayImages, 250);
  });
});