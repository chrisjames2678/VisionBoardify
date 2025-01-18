document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('[Options] DOM Content Loaded');
    
    // Initialize all required elements
    const imageUpload = document.getElementById('imageUpload');
    const imagesGrid = document.getElementById('imagesGrid');
    const imageCount = document.getElementById('imageCount');
    const backButton = document.getElementById('backToVisionBoard');
    const instructionsButton = document.getElementById('instructionsButton');
    const captionFont = document.getElementById('captionFont');
    const captionSize = document.getElementById('captionSize');
    const backgroundColor = document.getElementById('backgroundColor');
    const randomizeImages = document.getElementById('randomizeImages');

    if (!imageUpload || !imagesGrid || !imageCount) {
      console.error('[Options] Critical elements missing');
      throw new Error('Required elements not found');
    }

    // Check if all elements are found
    const missingElements = Object.entries(elements)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingElements.length > 0) {
      console.error('[Options] Missing elements:', missingElements);
      throw new Error(`Missing elements: ${missingElements.join(', ')}`);
    }

    const {imageUpload, imagesGrid, imageCount, backButton, instructionsButton} = elements;

  instructionsButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://newtab' }, (tab) => {
      // Wait for the new tab to load then show welcome modal
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.sendMessage(tab.id, { action: 'showWelcomeModal' });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  });
  const captionFont = document.getElementById('captionFont');
  const captionSize = document.getElementById('captionSize');
  const backgroundColor = document.getElementById('backgroundColor');
  const randomizeImages = document.getElementById('randomizeImages');

  // Load saved preferences
  chrome.storage.local.get(['captionFont', 'captionSize', 'backgroundColor', 'randomizeImages'], function(result) {
    if (result.randomizeImages !== undefined) randomizeImages.checked = result.randomizeImages;
    if (result.captionFont) captionFont.value = result.captionFont;
    if (result.captionSize) captionSize.value = result.captionSize;
    if (result.backgroundColor) backgroundColor.value = result.backgroundColor;
  });

  // Save background preference
  backgroundColor.addEventListener('change', (e) => {
    chrome.storage.local.set({ backgroundColor: e.target.value }, () => {
      // Apply background change immediately to preview
      if (e.target.value.startsWith('url')) {
        document.body.style.backgroundImage = e.target.value;
        document.body.style.backgroundColor = '#000000';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = e.target.value;
      }
    });
  });

  // Save and apply font preferences
  captionFont.addEventListener('change', (e) => {
    chrome.storage.local.set({ captionFont: e.target.value });
  });

  captionSize.addEventListener('change', (e) => {
    chrome.storage.local.set({ captionSize: e.target.value });
  });

  randomizeImages.addEventListener('change', (e) => {
    chrome.storage.local.set({ randomizeImages: e.target.checked });
  });

  // Handle back button click
  backButton.addEventListener('click', () => {
    // First create a new tab with chrome://newtab
    chrome.tabs.create({ url: 'chrome://newtab' }, () => {
      // Then close the current tab if we're in one
      window.close();
    });
  });

  async function updateImageGrid() {
    const images = await StorageManager.getImages();
    imageCount.textContent = images.length;
    imagesGrid.innerHTML = '';

    images.forEach((imageData, index) => {
      const div = document.createElement('div');
      div.className = 'image-item';
      div.draggable = true;
      div.dataset.index = index;
      
      div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        div.classList.add('dragging');
      });

      div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
      });

      div.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingItem = imagesGrid.querySelector('.dragging');
        if (draggingItem !== div) {
          const rect = div.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const insertAfter = e.clientY > midY;
          if (insertAfter) {
            div.parentNode.insertBefore(draggingItem, div.nextSibling);
          } else {
            div.parentNode.insertBefore(draggingItem, div);
          }
        }
      });

      div.addEventListener('drop', async (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(div.dataset.index);
        if (fromIndex !== toIndex) {
          try {
            await StorageManager.reorderImages(fromIndex, toIndex);
            await updateImageGrid();
          } catch (error) {
            console.error('Error reordering images:', error);
          }
        }
      });

      const img = document.createElement('img');
      img.src = typeof imageData === 'string' ? imageData : imageData.url;
      img.alt = `Vision board image ${index + 1}`;
      img.onerror = () => {
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" fill="%23666">Error</text></svg>';
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-button';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Remove image';
      deleteBtn.onclick = async () => {
        if (confirm('Are you sure you want to remove this image?')) {
          await StorageManager.removeImage(index);
          updateImageGrid();
        }
      };

      // Add caption input
      const captionInput = document.createElement('input');
      captionInput.type = 'text';
      captionInput.className = 'caption-input';
      captionInput.placeholder = 'Add a caption...';
      captionInput.value = typeof imageData === 'string' ? '' : (imageData.caption || '');

      // Handle caption updates with debounce
      let timeout;
      captionInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          try {
            await StorageManager.updateImageCaption(index, e.target.value);
          } catch (error) {
            console.error('Error updating caption:', error);
          }
        }, 500); // Wait 500ms after user stops typing
      });

      div.appendChild(img);
      div.appendChild(deleteBtn);
      div.appendChild(captionInput);
      imagesGrid.appendChild(div);
    });
  }

  // Initialize image upload handler
  imageUpload.addEventListener('change', async (event) => {
    console.log('[Upload] File input change detected');
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      console.log('[Upload] No files selected');
      return;
    }
    
    const maxFileSize = 5 * 1024 * 1024; // 5MB limit
    const maxImages = 20; // Maximum number of images
    console.log(`[Upload] Processing ${files.length} files`);
    let currentImages = await StorageManager.getImages();

    if (currentImages.length + files.length > maxImages) {
      alert(`You can only have up to ${maxImages} images in your vision board.`);
      event.target.value = '';
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > maxFileSize) {
        alert(`${file.name} is too large. Please upload images under 5MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await StorageManager.addImage(e.target.result);
          await updateImageGrid();
        } catch (error) {
          console.error('Error adding image:', error);
          alert('Failed to add image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  });

  // Initial load
  try {
    await updateImageGrid();
  } catch (error) {
    console.error('Error loading images:', error);
    imagesGrid.innerHTML = '<p style="color: #666; text-align: center;">Error loading images. Please refresh the page.</p>';
  }
});