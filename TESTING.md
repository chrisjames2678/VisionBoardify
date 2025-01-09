# Testing the Vision Board Mosaic Extension

## Local Testing Instructions

1. Download all the extension files to your local machine
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. Open a new tab to see the mosaic layout in action

## Test Cases for Mosaic Layout
1. Add 4-5 images of different sizes to test basic layout
2. Add 10+ images to test grid optimization
3. Add images with various aspect ratios to test gap minimization
4. Resize the browser window to test responsive layout
5. Check if images remain fully visible with minimal white space

## Expected Behavior
- Images should fill the screen with minimal gaps
- All images should be fully visible (no cropping)
- Layout should adjust smoothly when resizing
- Edge images should have slightly larger scaling
- Similar aspect ratio images should be grouped together
- Corner images should have extra scaling for better space utilization

## Testing Validation Points
1. Check that gaps between images are minimal (less than 1% of image size)
2. Verify that edge and corner images are slightly larger
3. Ensure no white spaces larger than 2% of screen size
4. Confirm smooth transitions during window resizing
5. Verify that all images are completely visible
6. Check that similar aspect ratio images are grouped nearby
7. Verify consistent spacing between grouped images

## Troubleshooting
- If images don't load, check the console for error messages
- If layout has large gaps, try adding more images
- Clear browser cache if changes don't appear
- For best results, use at least 6 images of varied sizes
- If groups seem scattered, try adding more similar aspect ratio images