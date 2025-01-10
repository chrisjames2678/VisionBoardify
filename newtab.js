document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');
  const configButton = document.getElementById('configButton');

  // Add click handler for config button
  configButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

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
      const imagePromises = images.map(async (imageUrl) => {
        try {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item';

          const imgElement = document.createElement('img');
          imgElement.src = imageUrl;
          imgElement.loading = 'lazy';

          // Add error handling for images
          imgElement.onerror = () => {
            itemDiv.style.display = 'none';
          };

          itemDiv.appendChild(imgElement);
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