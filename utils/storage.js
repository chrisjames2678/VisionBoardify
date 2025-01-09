class StorageManager {
  static async getImages() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['images'], function(result) {
        resolve(result.images || []);
      });
    });
  }

  static async addImage(imageData) {
    const images = await this.getImages();
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