document.addEventListener('DOMContentLoaded', async () => {
  const imageUpload = document.getElementById('imageUpload');
  const imagesGrid = document.getElementById('imagesGrid');
  const imageCount = document.getElementById('imageCount');
  const backButton = document.getElementById('backToVisionBoard');

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

      const img = document.createElement('img');
      img.src = imageData;
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

      div.appendChild(img);
      div.appendChild(deleteBtn);
      imagesGrid.appendChild(div);
    });
  }

  imageUpload.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB limit
    const maxImages = 20; // Maximum number of images
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