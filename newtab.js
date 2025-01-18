function createWelcomeModal() {
  const modal = document.createElement('div');
  modal.className = 'welcome-modal';
  modal.innerHTML = `
    <div class="welcome-container">
      <button class="close-modal">×</button>
      <h1>Welcome to VisionBoardify</h1>
      <p class="welcome-intro">The Chrome plugin to help you focus on your goals and dreams. Every time you open a new web page you'll be reminded of your own vision for your future.</p>
      <p class="settings-prompt">Click the ⚙️ settings button to begin.</p>
      
      <div class="steps-container">
        <div class="step-card">
          <div class="step-icon">🎯</div>
          <h3>Choose Images</h3>
          <p>Select images that represent your hopes and dreams for the future. Choose at least 12x for best results.</p>
        </div>
        <div class="step-card">
          <div class="step-icon">✍️</div>
          <h3>Add Captions</h3>
          <p>Enhance your vision with meaningful captions that appear when you hover over each image.</p>
        </div>
        <div class="step-card">
          <div class="step-icon">🎨</div>
          <h3>Customize</h3>
          <p>Select your background, font, and font size to create your perfect vision board.</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  return modal;
}

function showWelcomeModal() {
  let modal = document.querySelector('.welcome-modal');
  if (!modal) {
    modal = createWelcomeModal();
  }
  modal.style.display = 'block';
}

// Add message listener for welcome modal
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showWelcomeModal') {
    console.log('[Modal] Received show modal request');
    showWelcomeModal();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  // Add error handler for blank screen
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    document.body.innerHTML = `
      <div style="color: white; padding: 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>Please try refreshing the page. If the issue persists, you can access settings directly at:</p>
        <button onclick="chrome.runtime.openOptionsPage()" 
                style="padding: 10px; margin: 10px; cursor: pointer;">
          Open Settings
        </button>
      </div>`;
    console.error('Error: ', msg, error);
    return false;
  };
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

  // Add resize observer for debugging
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const width = entry.contentRect.width;
      const styles = getComputedStyle(container);
      const items = container.querySelectorAll('.item');
      console.log('[Layout Debug] ----------------');
      console.log(`[Layout] Window width: ${window.innerWidth}px`);
      console.log(`[Layout] Container width: ${width}px`);
      console.log(`[Layout] Effective columns: ${styles.columnCount}`);
      console.log(`[Layout] Column gap: ${styles.columnGap}`);
      console.log(`[Layout] Items per column: ~${Math.ceil(items.length / parseInt(styles.columnCount))}`);
      console.log(`[Layout] Total items: ${items.length}`);
      console.log(`[Layout] First item width: ${items[0]?.offsetWidth}px`);
      console.log(`[Layout] Container padding: ${styles.padding}`);
      console.log(`[Layout] Layout mode: ${container.className}`);
      
      // Check for layout issues
      if (items[0]?.offsetWidth === width) {
        console.warn('[Layout Warning] Items taking full container width - possible column failure');
      }
      if (parseInt(styles.columnCount) === 1 && width > 600) {
        console.warn('[Layout Warning] Single column on wide screen - check media queries');
      }
    }
  });
  resizeObserver.observe(container);

  let currentLayout = await getLayout();
  layoutSwitch.addEventListener('click', async () => {
    console.log(`[Layout] Switching from ${currentLayout}`);
    container.style.opacity = '0';
    setTimeout(async () => {
      currentLayout = currentLayout === 'masonry' ? 'bento' : 'masonry';
      console.log(`[Layout] New layout: ${currentLayout}`);
      layoutSwitch.textContent = currentLayout;
      localStorage.setItem('layout', currentLayout);
      container.className = currentLayout;
      console.log(`[Layout] Container class set to: ${container.className}`);
      await displayImages();
      console.log('[Layout] Images displayed');
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
      console.log('[Images] Starting image display');
      let images = await StorageManager.getImages();
      console.log(`[Images] Retrieved ${images?.length || 0} images`);
      
      // Check if randomization is enabled
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['randomizeImages'], resolve);
      });
      
      if (result.randomizeImages) {
        images = [...images].sort(() => Math.random() - 0.5);
      }

      if (!images || images.length === 0) {
        showWelcomeModal();
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
            console.error('[Images] Failed to load image:', typeof imageData === 'string' ? imageData : imageData.url);
            itemDiv.style.display = 'none';
          };

          imgElement.onload = () => {
            console.log('[Images] Successfully loaded image:', 
              imgElement.naturalWidth + 'x' + imgElement.naturalHeight);
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