class StorageManager {
  static async getDefaultImages() {
    const defaultImages = [
      'images/default1.jpg',
      'images/default2.jpg',
      'images/default3.jpg',
      'images/default4.jpg'
    ];
    return defaultImages;
  }

  static async getImages() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['images'], async function(result) {
        // If no custom images are stored, return default images
        if (!result.images || result.images.length === 0) {
          const defaultImages = await StorageManager.getDefaultImages();
          resolve(defaultImages);
        } else {
          resolve(result.images || []);
        }
      });
    });
  }

  static async addImage(imageData) {
    const images = await this.getImages();
    // If current images are defaults, clear them before adding custom image
    if (images.some(img => img.startsWith('images/'))) {
      images.length = 0;
    }
    images.push(imageData);

    return new Promise((resolve) => {
      chrome.storage.local.set({ images }, resolve);
    });
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
}