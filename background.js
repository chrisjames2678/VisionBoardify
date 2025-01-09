// Store the cached mosaic in memory
let cachedMosaic = null;

// Initialize storage when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['images'], function(result) {
    if (!result.images) {
      chrome.storage.local.set({ images: [] });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CACHED_MOSAIC') {
    // Get cached mosaic from storage
    chrome.storage.local.get(['cachedMosaic'], function(result) {
      sendResponse({ mosaic: result.cachedMosaic });
    });
    return true; // Keep message channel open for async response
  } 
  else if (request.type === 'SET_CACHED_MOSAIC') {
    // Store new mosaic in storage
    chrome.storage.local.set({ 
      cachedMosaic: request.mosaic 
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});