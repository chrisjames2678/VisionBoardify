document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');
  const configButton = document.getElementById('configButton');
  const layoutSwitch = document.getElementById('layoutSwitch');

  // Apply background
  chrome.storage.local.get(['backgroundColor'], function(result) {
    if (result.backgroundColor) {
      if (result.backgroundColor.startsWith('url')) {
        document.body.style.backgroundImage = result.backgroundColor;
        document.body.style.backgroundColor = '#000000';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = result.backgroundColor;
      }
    } else {
      // Set default background if none is set
      document.body.style.backgroundColor = '#000000';
    }
  });


  // Add click handler for config button
  configButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Get layout preference (placeholder - needs actual implementation)
  const getLayout = async () => {
    // Replace with your actual layout preference retrieval logic
    return localStorage.getItem('layout') || '1x'; 
  };

  let currentLayout = await getLayout();
  layoutSwitch.addEventListener('click', async () => {
    container.style.opacity = '0';
    setTimeout(async () => {
      currentLayout = currentLayout === 'masonry' ? 'bento' : 'masonry';
      layoutSwitch.textContent = currentLayout;
      localStorage.setItem('layout', currentLayout);
      container.className = currentLayout;
      await displayImages();
      setTimeout(() => {
        container.style.opacity = '1';
      }, 50);
    }, 300);
  });

  // Set initial layout text
  currentLayout = localStorage.getItem('layout') || 'masonry';
  layoutSwitch.textContent = currentLayout;


  async function displayImages() {
    try {
      const images = await StorageManager.getImages();

      if (!images || images.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #fff;">
            <p>No images yet</p>
          </div>`;
        return;
      }

      container.innerHTML = '';

      // Process images in parallel
      const imagePromises = images.map(async (imageData) => {
        try {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item new-item';

          const imgElement = document.createElement('img');
          imgElement.src = typeof imageData === 'string' ? imageData : imageData.url;
          imgElement.loading = 'lazy';

          // Create caption overlay
          const captionOverlay = document.createElement('div');
          captionOverlay.className = 'caption-overlay';

          // Create caption text
          const captionText = document.createElement('div');
          captionText.className = 'caption-text';
          const hasCaption = typeof imageData !== 'string' && imageData.caption && imageData.caption.trim() !== '';
          
          if (hasCaption) {
            captionText.textContent = imageData.caption;
            captionOverlay.style.display = 'flex';
            // Apply font settings
            chrome.storage.local.get(['captionFont', 'captionSize'], function(result) {
              if (result.captionFont) captionText.style.fontFamily = result.captionFont;
              if (result.captionSize) captionText.dataset.size = result.captionSize;
            });
          } else {
            captionOverlay.style.display = 'none';
          }

          // Add error handling for images
          imgElement.onerror = () => {
            itemDiv.style.display = 'none';
          };

          captionOverlay.appendChild(captionText);
          itemDiv.appendChild(imgElement);
          itemDiv.appendChild(captionOverlay);
          return itemDiv;
        } catch (error) {
          console.error('Error loading image:', error);
          return null;
        }
      });

      // Add all successfully loaded images to the container
      const loadedImages = await Promise.all(imagePromises);
      loadedImages
        .filter(item => item !== null)
        .forEach(item => container.appendChild(item));

    } catch (error) {
      console.error('Error displaying images:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #fff;">
          <p>Error loading images</p>
        </div>`;
    }
  }

  await displayImages();
});