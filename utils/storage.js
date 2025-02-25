class StorageManager {
  static async getImages() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['images'], function(result) {
        const images = result.images || [];
        // Normalize image format
        const normalizedImages = images.map(image => {
          if (typeof image === 'string') {
            return {
              url: image,
              caption: '',
              timestamp: new Date().toISOString()
            };
          }
          return image;
        });
        resolve(normalizedImages);
      });
    });
  }

  static async addImage(imageData, caption = '') {
    const images = await this.getImages();
    const imageEntry = {
      url: imageData,
      caption: caption,
      timestamp: new Date().toISOString()
    };
    images.push(imageEntry);

    return new Promise((resolve) => {
      chrome.storage.local.set({ images }, resolve);
    });
  }

  static async updateImageCaption(index, caption) {
    const images = await this.getImages();
    if (images[index]) {
      if (typeof images[index] === 'string') {
        // Convert old format to new format
        images[index] = {
          url: images[index],
          caption: caption,
          timestamp: new Date().toISOString()
        };
      } else {
        // Update existing caption
        images[index].caption = caption;
      }
      return new Promise((resolve) => {
        chrome.storage.local.set({ images }, resolve);
      });
    }
    return Promise.reject(new Error('Image not found'));
  }

  static async removeImage(index) {
    const images = await this.getImages();
    images.splice(index, 1);

    return new Promise((resolve) => {
      chrome.storage.local.set({ images }, resolve);
    });
  }

  static async clearImages() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ images: [] }, resolve);
    });
  }

  static async reorderImages(fromIndex, toIndex) {
    const images = await this.getImages();
    if (fromIndex >= 0 && fromIndex < images.length && toIndex >= 0 && toIndex < images.length) {
      const [movedImage] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, movedImage);
      return new Promise((resolve) => {
        chrome.storage.local.set({ images }, resolve);
      });
    }
    return Promise.reject(new Error('Invalid indices'));
  }
}