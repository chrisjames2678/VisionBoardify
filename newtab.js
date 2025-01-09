document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');
  const openOptionsButton = document.getElementById('openOptions');
  const patternButtons = document.querySelectorAll('.pattern-button');
  let currentPattern = 'grid';

  // Handle options button click
  openOptionsButton.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    } else {
      console.log('Running in development mode - options page not available');
    }
  });

  // Handle pattern switching
  patternButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.pattern !== currentPattern) {
        patternButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentPattern = button.dataset.pattern;
        displayMosaic();
      }
    });
  });

  async function displayMosaic() {
    try {
      // Get images
      let images;
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        images = await StorageManager.getImages();
      } else {
        // Development mode: use test images
        images = [
          encodeURI('attached_assets/Screenshot 2025-01-09 at 19.56.05.png'),
          encodeURI('attached_assets/Screenshot 2025-01-09 at 20.09.35.png'),
          encodeURI('attached_assets/Screenshot 2025-01-09 at 20.21.22.png'),
          encodeURI('attached_assets/Screenshot 2025-01-09 at 20.36.33.png'),
          encodeURI('attached_assets/Screenshot 2025-01-09 at 20.54.44.png'),
          encodeURI('attached_assets/Screenshot 2025-01-09 at 21.11.59.png')
        ];
      }

      // Show message if no images
      if (!images || !images.length) {
        container.innerHTML = `
          <div style="text-align: center; padding-top: 40vh; color: #666;">
            <p>No images added yet.</p>
            <p>Click the settings button to configure your vision board.</p>
          </div>`;
        return;
      }

      // Process images
      const processedImages = await MosaicGenerator.generate(images);

      // Clear container
      container.innerHTML = '';

      if (currentPattern === 'grid') {
        // Grid layout
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.alignContent = 'flex-start';
        container.style.gap = '16px';

        processedImages.forEach((img, index) => {
          const tile = document.createElement('div');
          tile.className = 'image-tile';
          Object.assign(tile.style, img.style);

          const imgElement = document.createElement('img');
          imgElement.src = img.src;
          imgElement.alt = `Vision ${index + 1}`;
          imgElement.loading = 'lazy';

          tile.appendChild(imgElement);
          container.appendChild(tile);
        });
      } else {
        // Honeycomb layout
        container.style.display = 'block';
        container.style.position = 'relative';
        container.style.height = '100vh';

        const honeycombImages = MosaicGenerator.generateHoneycomb(
          processedImages,
          window.innerWidth - 32,
          window.innerHeight - 32
        );

        honeycombImages.forEach((img, index) => {
          const tile = document.createElement('div');
          tile.className = 'image-tile honeycomb';
          Object.assign(tile.style, img.style);

          const imgElement = document.createElement('img');
          imgElement.src = img.src;
          imgElement.alt = `Vision ${index + 1}`;
          imgElement.loading = 'lazy';

          tile.appendChild(imgElement);
          container.appendChild(tile);
        });
      }

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