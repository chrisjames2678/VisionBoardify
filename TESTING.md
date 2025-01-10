# Testing the Vision Board Mosaic Extension

## Local Testing Instructions

1. Download all the extension files to your local machine
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. Open a new tab to see the grid layout in action

## Test Cases for Grid Layout
1. Add 4-5 images of different sizes to test basic grid layout
2. Add 10+ images to test grid optimization
3. Add images with various aspect ratios to test layout consistency
4. Resize the browser window to test responsive layout
5. Check if images maintain proper spacing and alignment

## Expected Behavior
- Images should arrange in a clean, responsive grid
- Wide images (aspect ratio > 1.5) span two columns
- Edge images scale slightly larger (10% increase)
- Layout should adjust smoothly when resizing
- Similar aspect ratio images should appear visually balanced
- Consistent spacing between all grid items

## Testing Validation Points
1. Verify grid responsiveness across different screen sizes
2. Check that wide images span two columns correctly
3. Confirm edge images have proper scaling
4. Test smooth transitions during window resizing
5. Verify that all images are completely visible
6. Check consistent spacing between grid items
7. Ensure proper image aspect ratio maintenance

## Troubleshooting
- If images don't load, check the console for error messages
- Clear browser cache if changes don't appear
- For best results, use at least 6 images
- If grid seems unbalanced, try adding more similar-sized images