document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mosaic-container');

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

      images.forEach((imageUrl) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.loading = 'lazy';

        // Add error handling for images
        img.onerror = () => {
          img.style.display = 'none';
          itemDiv.style.display = 'none';
        };

        itemDiv.appendChild(img);
        container.appendChild(itemDiv);
      });

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