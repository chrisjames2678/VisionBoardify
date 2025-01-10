document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');
  const openOptionsButton = document.getElementById('openOptions');

  // Handle options button click
  openOptionsButton.addEventListener('click', () => {
    if (chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  function resizeGridItem(item) {
    const height = item.getBoundingClientRect().height;
    const rowSpan = Math.ceil(height);
    item.style.gridRowEnd = `span ${rowSpan}`;
  }

  function resizeAllGridItems() {
    const allItems = container.getElementsByTagName('img');
    for (const item of allItems) {
      if (item.complete) {
        resizeGridItem(item);
      }
    }
  }

  async function displayImages() {
    try {
      const images = await StorageManager.getImages();

      if (!images || images.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
            <p>No images added yet.</p>
            <p>Click the ⚙️ button to configure your vision board.</p>
          </div>`;
        return;
      }

      container.innerHTML = '';

      images.forEach((imageUrl, index) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Vision board image ${index + 1}`;
        img.loading = 'lazy';

        img.onerror = () => {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666"%3EError%3C/text%3E%3C/svg%3E';
          img.alt = 'Failed to load image';
          resizeGridItem(img);
        };

        img.onload = () => {
          resizeGridItem(img);
        };

        container.appendChild(img);
      });

    } catch (error) {
      console.error('Error displaying images:', error);
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
          <p>Error loading images.</p>
          <p>Please try refreshing the page.</p>
        </div>`;
    }
  }

  // Initial display
  await displayImages();

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeAllGridItems, 250);
  });

  // Watch for DOM changes
  const observer = new MutationObserver(resizeAllGridItems);
  observer.observe(container, { childList: true });
});