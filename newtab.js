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
          <p>Select images that represent your hopes and dreams for the future. These will be your daily visual reminders.</p>
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
        showWelcomeModal();
        return;
      }
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