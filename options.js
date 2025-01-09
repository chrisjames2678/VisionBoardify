document.addEventListener('DOMContentLoaded', async () => {
  const imageUpload = document.getElementById('imageUpload');
  const imagesGrid = document.getElementById('imagesGrid');
  const imageCount = document.getElementById('imageCount');
  const backButton = document.getElementById('backToVisionBoard');

  // Handle back button click
  backButton.addEventListener('click', () => {
    // Open a new tab with the extension's new tab page
    chrome.tabs.create({ url: 'chrome://newtab' });
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

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-button';
      deleteBtn.innerHTML = '×';
      deleteBtn.onclick = async () => {
        await StorageManager.removeImage(index);
        updateImageGrid();
      };

      div.appendChild(img);
      div.appendChild(deleteBtn);
      imagesGrid.appendChild(div);
    });
  }

  imageUpload.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB limit

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
        await StorageManager.addImage(e.target.result);
        updateImageGrid();
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  });

  updateImageGrid();
});