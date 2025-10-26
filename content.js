// Store original image sources
const originalImages = new Map();
let productImages = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    // Respond to ping to confirm script is loaded
    sendResponse({ loaded: true });
  } else if (request.action === 'getProductImages') {
    getProductImages().then(images => {
      sendResponse({ images: images });
    });
    return true;
  } else if (request.action === 'replaceWithTryOn') {
    replaceWithTryOnImages(request.tryOnImages);
    sendResponse({ success: true });
  } else if (request.action === 'resetImages') {
    resetAllImages();
    sendResponse({ success: true });
  }
  return true;
});

async function getProductImages() {
  const hostname = window.location.hostname;
  const isMyntra = hostname.includes('myntra.com');
  const isSnitch = hostname.includes('snitch.co.in') || hostname.includes('snitch.com');

  let selectors = [];

  if (isMyntra) {
    selectors = [
      'img[src*="assets.myntassets.com"]',
      'img[src*="myntra.com"]',
      '.image-grid-image',
      '.image-grid-imageContainer img',
      '.imageSlider-image',
      '.pdp-image img',
      'picture img',
      '[class*="imageContainer"] img',
      '[class*="ImageContainer"] img',
      '[class*="slider"] img',
      '[class*="Slider"] img'
    ];
  } else if (isSnitch) {
    selectors = [
      'img[src*="cdn.shopify.com"]',
      'img[src*="snitch.co.in"]',
      '.product-media img',
      '.aspect-square img',
      '.cursor-pointer img',
      '.border-2 img',
      'div.relative img[data-nimg="fill"]',
      '.product-gallery img',
      'img[alt*="Snitch"]',
      'img[alt*="Image of"]'
    ];
  }

  const imageElements = document.querySelectorAll(selectors.join(','));
  const uniqueSrcs = new Set();

  imageElements.forEach(img => {
    const src = img.currentSrc || img.src;
    if (src && !uniqueSrcs.has(src)) {
      uniqueSrcs.add(src);
    }
  });

  console.log(`🖼️ Found ${uniqueSrcs.size} images on ${hostname}`, [...uniqueSrcs]);
  return [...uniqueSrcs];
}



// Convert image URL to base64 using fetch with proper error handling
async function imageToBase64(url) {
  try {
    // Try to fetch the image
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error('Fetch failed');
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // If fetch fails (CORS or network), try using Image with canvas
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (canvasError) {
          console.warn('Canvas conversion failed, using original URL:', canvasError);
          resolve(url);
        }
      };

      img.onerror = function () {
        console.warn('Image load failed, using original URL');
        resolve(url);
      };

      img.src = url;
    });
  }
}

// IMPROVED: Replace all images with try-on versions
function replaceWithTryOnImages(tryOnImages) {
  console.log('Starting image replacement with try-on images:', tryOnImages.length);

  if (!tryOnImages || tryOnImages.length === 0) {
    console.error('No try-on images provided');
    return;
  }

  const tryOnImage = tryOnImages[0];

  // Enhanced selectors for Myntra
  const selectors = [
    // --- Myntra selectors ---
    'img[src*="assets.myntassets.com"]',
    'img[src*="myntra.com"]',
    '.image-grid-image',
    '.image-grid-imageContainer img',
    '.imageSlider-image',
    '.pdp-image img',
    'picture img',
    '[class*="imageContainer"] img',
    '[class*="ImageContainer"] img',
    '[class*="slider"] img',
    '[class*="Slider"] img',

    // --- Snitch selectors ---
    'img[src*="cdn.shopify.com"]',
    'div.relative img[data-nimg="fill"]',
    '.product-media img',
    '.aspect-square img',
    '.cursor-pointer img',
    '.border-2 img',
    'img[alt*="snitch"]',
    'img[alt*="Image of"]'
  ];

  const images = document.querySelectorAll(selectors.join(','));
  let replacedCount = 0;

  console.log(`Found ${images.length} images to potentially replace`);

  images.forEach((img, index) => {
    // Only replace if it's a product image (contains myntassets or myntra)
    if (
      img.src && (
        img.src.includes('myntassets.com') ||
        img.src.includes('myntra.com') ||
        img.src.includes('cdn.shopify.com') ||
        img.src.includes('snitch.co.in') ||
        img.src.includes('snitch.com')
      )
    ) {

      // Store original source if not already stored
      if (!originalImages.has(img)) {
        originalImages.set(img, {
          src: img.src,
          srcset: img.srcset || '',
          parent: img.parentElement
        });

        // If image is inside a picture element, store source elements
        if (img.parentElement && img.parentElement.tagName === 'PICTURE') {
          const sources = img.parentElement.querySelectorAll('source');
          sources.forEach(source => {
            if (!originalImages.has(source)) {
              originalImages.set(source, {
                srcset: source.srcset || '',
                parent: img.parentElement
              });
            }
          });
        }
      }

      // Apply the replacement with smooth transition
      img.style.transition = 'opacity 0.3s ease-in-out';
      img.style.opacity = '0';

      setTimeout(() => {
        // Set the new image
        img.src = tryOnImage;
        img.srcset = '';

        // Force reload if needed
        img.removeAttribute('srcset');

        // Handle picture elements
        if (img.parentElement && img.parentElement.tagName === 'PICTURE') {
          const sources = img.parentElement.querySelectorAll('source');
          sources.forEach(source => {
            source.srcset = '';
            source.removeAttribute('srcset');
          });
        }

        // Ensure image loads
        img.onload = () => {
          img.style.opacity = '1';
          console.log(`Successfully replaced image ${index + 1}`);
        };

        // Fallback to show image even if onload doesn't fire
        setTimeout(() => {
          img.style.opacity = '1';
        }, 500);

        replacedCount++;
      }, 300);
    }
  });

  // Also handle background images
  const elementsWithBg = document.querySelectorAll('[style*="background-image"]');
  elementsWithBg.forEach(el => {
    const currentBg = el.style.backgroundImage;
    if (currentBg && (currentBg.includes('myntassets.com') || currentBg.includes('myntra.com'))) {
      if (!originalImages.has(el)) {
        originalImages.set(el, {
          backgroundImage: currentBg
        });
      }

      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.backgroundImage = `url("${tryOnImage}")`;
        el.style.opacity = '1';
        replacedCount++;
      }, 300);
    }
  });

  console.log(`Replaced ${replacedCount} images with virtual try-on`);

  // Add watermark to indicate it's virtual try-on
  setTimeout(() => addTryOnWatermark(), 500);

  // Force a re-check after 1 second for lazy-loaded images
  setTimeout(() => {
    const newImages = document.querySelectorAll(selectors.join(','));
    newImages.forEach(img => {
      if (img.src && (img.src.includes('myntassets.com') || img.src.includes('myntra.com')) && !originalImages.has(img)) {
        originalImages.set(img, {
          src: img.src,
          srcset: img.srcset || ''
        });
        img.src = tryOnImage;
        img.srcset = '';
      }
    });
  }, 1000);
}

// Add a subtle watermark
function addTryOnWatermark() {
  // Remove existing watermark if any
  const existing = document.getElementById('virtual-tryon-watermark');
  if (existing) existing.remove();

  const watermark = document.createElement('div');
  watermark.id = 'virtual-tryon-watermark';
  watermark.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(102, 126, 234, 0.95);
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    font-size: 13px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  watermark.textContent = '✨ Virtual Try-On Active';
  document.body.appendChild(watermark);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    watermark.style.transition = 'opacity 0.5s';
    watermark.style.opacity = '0';
    setTimeout(() => watermark.remove(), 500);
  }, 5000);
}

// Reset all images to original
function resetAllImages() {
  console.log('Resetting all images to original');

  // Restore all original images
  originalImages.forEach((original, element) => {
    element.style.transition = 'opacity 0.3s';
    element.style.opacity = '0';

    setTimeout(() => {
      if (element.tagName === 'IMG') {
        element.src = original.src;
        element.srcset = original.srcset;
      } else if (element.tagName === 'SOURCE') {
        element.srcset = original.srcset;
      } else if (original.backgroundImage) {
        element.style.backgroundImage = original.backgroundImage;
      }

      element.style.opacity = '1';
    }, 300);
  });

  // Clear the map
  originalImages.clear();

  // Remove watermark
  const watermark = document.getElementById('virtual-tryon-watermark');
  if (watermark) watermark.remove();

  console.log('Reset complete');
}

// Observer for dynamically loaded images
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        const newImages = node.querySelectorAll('img[src*="myntassets.com"], img[src*="myntra.com"], img[src*="cdn.shopify.com"]');
        if (newImages.length > 0) {
          productImages.push(...newImages);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Myntra Virtual Try-On content script loaded');