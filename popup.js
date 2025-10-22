// UI Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('previewContainer');
const removeImage = document.getElementById('removeImage');
const tryOnBtn = document.getElementById('tryOnBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const progressFill = document.getElementById('progressFill');
const apiKey = document.getElementById('apiKey');
const productImagesContainer = document.getElementById('productImagesContainer');
const productImageGrid = document.getElementById('productImageGrid');
const fetchImagesBtn = document.getElementById('fetchImagesBtn');

let userImageData = null;
let productImages = [];
let selectedProductImage = null;

// Load saved API key
chrome.storage.local.get(['glamAiApiKey'], (result) => {
  if (result.glamAiApiKey) {
    apiKey.value = result.glamAiApiKey;
  }
  checkReadiness();
});

// Save API key
apiKey.addEventListener('change', () => {
  chrome.storage.local.set({ glamAiApiKey: apiKey.value });
  checkReadiness();
});

// Upload events
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// Remove image
removeImage.addEventListener('click', (e) => {
  e.stopPropagation();
  userImageData = null;
  previewContainer.style.display = 'none';
  checkReadiness();
  showStatus('🗑️ Image removed', 'info');
});

// Handle image upload
function handleFile(file) {
  if (!file.type.startsWith('image/')) return showStatus('⚠️ Please select an image file', 'warning');
  if (file.size > 10 * 1024 * 1024) return showStatus('⚠️ Image too large (max 10MB)', 'warning');

  const reader = new FileReader();
  reader.onload = (e) => {
    userImageData = e.target.result;
    preview.src = userImageData;
    previewContainer.style.display = 'block';
    showStatus('✅ Image loaded!', 'success');
    checkReadiness();
  };
  reader.onerror = () => showStatus('❌ Failed to read file', 'error');
  reader.readAsDataURL(file);
}

// Fetch product images from Myntra page
fetchImagesBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('myntra.com')) {
      showStatus('⚠️ Please open a Myntra product page', 'warning');
      return;
    }

    showStatus('🔍 Fetching product images...', 'info');
    fetchImagesBtn.disabled = true;

    // Ensure content script is loaded
    const scriptLoaded = await ensureContentScriptLoaded(tab.id);
    if (!scriptLoaded) {
      throw new Error('Failed to load content script. Please refresh the page and try again.');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProductImages' });
    if (!response || !response.images?.length) {
      throw new Error('No product images found on this page.');
    }

    productImages = response.images;
    displayProductImages(productImages);
    showStatus(`✅ Found ${productImages.length} product images`, 'success');
    
  } catch (error) {
    showStatus('❌ ' + error.message, 'error');
    console.error('Fetch images error:', error);
  } finally {
    fetchImagesBtn.disabled = false;
  }
});

// Display product images in a grid
function displayProductImages(images) {
  productImageGrid.innerHTML = '';
  productImagesContainer.style.display = 'block';

  images.forEach((imgData, index) => {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'product-image-wrapper';
    
    const img = document.createElement('img');
    img.src = imgData;
    img.className = 'product-image-thumb';
    img.alt = `Product ${index + 1}`;
    
    const selectOverlay = document.createElement('div');
    selectOverlay.className = 'select-overlay';
    selectOverlay.innerHTML = '<span>✓</span>';
    
    imgWrapper.appendChild(img);
    imgWrapper.appendChild(selectOverlay);
    
    imgWrapper.addEventListener('click', () => {
      // Remove selection from all
      document.querySelectorAll('.product-image-wrapper').forEach(w => {
        w.classList.remove('selected');
      });
      
      // Select this one
      imgWrapper.classList.add('selected');
      selectedProductImage = imgData;
      showStatus(`✅ Selected image ${index + 1}`, 'success');
      checkReadiness();
    });
    
    productImageGrid.appendChild(imgWrapper);
  });

  // Auto-select first image
  if (images.length > 0) {
    productImageGrid.firstChild.classList.add('selected');
    selectedProductImage = images[0];
    checkReadiness();
  }
}

// Check if ready
function checkReadiness() {
  const ready = apiKey.value.trim() && userImageData && selectedProductImage;
  tryOnBtn.disabled = !ready;
  
  if (!apiKey.value.trim()) {
    showStatus('⚠️ Enter your Glam.AI API key', 'warning');
  } else if (!userImageData) {
    showStatus('⚠️ Upload your photo', 'warning');
  } else if (!selectedProductImage) {
    showStatus('⚠️ Fetch and select a product image', 'warning');
  }
}

// Inject content script if not already loaded
async function ensureContentScriptLoaded(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return true;
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (injectError) {
      console.error('Failed to inject content script:', injectError);
      return false;
    }
  }
}

// Try-on button
tryOnBtn.addEventListener('click', async () => {
  if (!userImageData || !apiKey.value || !selectedProductImage) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('myntra.com')) {
      showStatus('⚠️ Please open a Myntra product page', 'warning');
      return;
    }

    showLoading(true, 'Initializing...');
    updateProgress(5);

    // Ensure content script is loaded
    const scriptLoaded = await ensureContentScriptLoaded(tab.id);
    if (!scriptLoaded) {
      throw new Error('Failed to load content script. Please refresh the page and try again.');
    }

    showLoading(true, 'Uploading images...');
    updateProgress(20);

    const [personUrl, clothUrl] = await Promise.all([
      uploadToS3ViaApiGateway(userImageData),
      uploadToS3ViaApiGateway(selectedProductImage)
    ]);

    updateProgress(40);
    showLoading(true, 'Calling Glam.AI...');

    // Start processing
    const resultInit = await callGlamAI(personUrl, clothUrl);
    const eventId = resultInit.body?.event_id;
    if (!eventId) throw new Error('No event_id received from Glam.AI');

    // Poll every 10 seconds until status === "READY"
    let statusCheck = "IN_PROGRESS";
    let resultData = null;
    let attempts = 0;
    const maxAttempts = 12; // 12 * 10s = 2 minutes max

    while (statusCheck === "IN_PROGRESS" && attempts < maxAttempts) {
      showLoading(true, `Processing with AI... (${attempts + 1}/${maxAttempts})`);
      updateProgress(50 + (attempts * 3));

      await new Promise(r => setTimeout(r, 10000)); // wait 10 sec
      const resultResponse = await callGlamAIResult(eventId);

      statusCheck = resultResponse.body?.result?.status;
      if (statusCheck === "READY") {
        resultData = resultResponse.body?.result;
        break;
      }
      attempts++;
    }

    if (!resultData || !resultData.media_urls?.length)
      throw new Error('Glam.AI did not return a result in time.');

    const urlResult = resultData.media_urls[0];
    updateProgress(90);
    showLoading(true, 'Applying AI result...');

    // Convert via background worker to avoid CORS
    const resultBase64 = await convertImageViaBackground(urlResult);
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'replaceWithTryOn',
      tryOnImages: [resultBase64]
    });

    updateProgress(100);
    showLoading(false);
    showStatus('✨ AI Try-On Complete!', 'success');
    resetBtn.style.display = 'block';

  } catch (err) {
    showLoading(false);
    showStatus('❌ ' + err.message, 'error');
    console.error('Try-on error:', err);
  }
});


async function uploadToS3ViaApiGateway(imageData) {
  // Convert base64 data URL to Blob
  let blob;
  if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    blob = new Blob([ab], { type: mimeString });
  } else if (imageData instanceof File || imageData instanceof Blob) {
    blob = imageData;
  } else {
    throw new Error('Invalid image data');
  }

  const formData = new FormData();
  formData.append('file', blob, 'upload.png'); // fieldname must be 'file'

  try {
    const response = await fetch('https://ah2zhsw899.execute-api.eu-north-1.amazonaws.com/prod', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Response from API:', data);

    if (!response.ok || !data.imageUrl) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.imageUrl;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
}



// Call Glam.AI via Lambda API Gateway
async function callGlamAI(personUrl, clothUrl) {
  const response = await fetch('https://ggbhbc09mc.execute-api.eu-north-1.amazonaws.com/prod', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey.value,
      media_url: personUrl,
      garment_url: clothUrl
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Lambda API call failed');
  return data;
}

// Call Glam.AI result via Lambda API Gateway
async function callGlamAIResult(event_id) {
  const response = await fetch('https://3953ueyyg3.execute-api.eu-north-1.amazonaws.com/prod', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey.value,
      event_id: event_id,
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Lambda API call failed');
  return data;
}

// Convert image via background script to avoid CORS
async function convertImageViaBackground(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'fetchImage', url: url },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.dataUrl);
        } else {
          reject(new Error(response?.error || 'Failed to fetch image'));
        }
      }
    );
  });
}

// Reset images on page
resetBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'resetImages' });
    showStatus('🔄 Reset complete', 'success');
    resetBtn.style.display = 'none';
  } catch (error) {
    showStatus('❌ ' + error.message, 'error');
  }
});

// UI Helpers
function showLoading(show, text = 'Processing...') {
  loading.style.display = show ? 'block' : 'none';
  tryOnBtn.disabled = show;
  if (text) loadingText.textContent = text;
}
function updateProgress(percent) {
  progressFill.style.width = percent + '%';
}
function showStatus(message, type = 'info') {
  status.textContent = message;
  status.style.color =
    type === 'success' ? '#4ade80' :
    type === 'warning' ? '#fbbf24' :
    type === 'error'   ? '#ef4444' : 'white';
}