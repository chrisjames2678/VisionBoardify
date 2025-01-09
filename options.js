document.addEventListener('DOMContentLoaded', async () => {
  const imageUpload = document.getElementById('imageUpload');
  const imagesGrid = document.getElementById('imagesGrid');
  const imageCount = document.getElementById('imageCount');

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
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
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
