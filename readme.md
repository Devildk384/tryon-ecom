# Myntra Virtual Try-On Extension

A Chrome extension that creates virtual try-on images by overlaying Myntra products onto your uploaded photo!

## 🎯 What It Does

1. **Upload your photo** (full body or upper body)
2. **Extension extracts the product images** from Myntra
3. **Creates virtual try-on** by overlaying the product on your photo
4. **Replaces all product images** on the page with your try-on version!

Perfect for visualizing how shirts, jackets, dresses, or pants would look on you!

## 📁 Files Needed

Create these 4 files in a folder:

1. `manifest.json` - Extension configuration
2. `popup.html` - Extension popup interface with try-on controls
3. `popup.js` - Handles image processing and virtual try-on creation
4. `content.js` - Extracts product images and replaces them

## 🎨 Icons (Optional but Recommended)

Create 3 icon files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## 📦 Installation Steps

1. **Create a folder** for your extension (e.g., "MyntraVirtualTryOn")

2. **Copy all the code files** into this folder:
   - Create `manifest.json` and paste the manifest code
   - Create `popup.html` and paste the popup HTML code
   - Create `popup.js` and paste the popup JavaScript code
   - Create `content.js` and paste the content script code

3. **Add icons** (or extension will use default Chrome icons)

4. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select your extension folder
   - The extension should now appear in your extensions list

## 🚀 How to Use

### Step 1: Prepare Your Photo
Take or find a photo of yourself:
- **Best results:** Full body or upper body photo
- **Good lighting** and clear view
- **Stand straight** facing the camera
- **Plain background** works best

### Step 2: Visit Myntra
Go to any Myntra product page with the item you want to try on:
- Shirts, T-Shirts
- Jackets, Hoodies
- Dresses
- Pants, Jeans

### Step 3: Create Virtual Try-On
1. **Click the extension icon** in Chrome toolbar
2. **Upload your photo** (click or drag & drop)
3. **Adjust settings:**
   - **Product Type:** Select what you're trying on
   - **Product Size:** Adjust how large the product appears (30-120%)
   - **Vertical Position:** Move product up/down on your body (0-60%)
   - **Opacity:** Control transparency (50-100%)
4. **Click "Create Virtual Try-On"**

### Step 4: See Results
- All product images on the page will be replaced with your try-on version!
- A "Virtual Try-On" badge appears briefly in the corner
- Adjust settings and click again to refine
- Click "Reset to Original" to restore Myntra's images

## ✨ Features

- 🎨 **Virtual Try-On Creation** - Overlay products on your photos
- ⚙️ **Adjustable Settings** - Control size, position, and opacity
- 👕 **Multiple Product Types** - Shirts, jackets, dresses, pants
- 🔄 **Real-time Adjustments** - Change settings and regenerate instantly
- 💫 **Smooth Transitions** - Beautiful fade animations
- 🎯 **Auto-Detection** - Finds all product images automatically
- 📱 **Works on All Myntra Pages** - Product pages with image galleries

## 🎛️ Settings Explained

### Product Type
- **Shirt/T-Shirt:** For upper body wear
- **Jacket/Hoodie:** For outerwear
- **Dress:** For full-length dresses
- **Pants/Jeans:** For lower body wear

### Product Size (30-120%)
- Lower values = smaller product
- Higher values = larger product
- Default 70% works well for most photos

### Vertical Position (0-60%)
- 0% = Top of image
- 30% = Chest area (default, good for shirts)
- 60% = Lower body (good for pants)

### Opacity (50-100%)
- Lower = More transparent (see your body through product)
- Higher = More solid (product covers more)
- 85% default provides good balance

## 💡 Tips for Best Results

### Photo Tips:
- ✅ Use well-lit photos
- ✅ Face the camera directly
- ✅ Wear fitted clothing or plain colors
- ✅ Stand against plain background
- ❌ Avoid busy backgrounds
- ❌ Avoid extreme angles

### Product Selection:
- Works best with **front-view product images**
- Choose products with **transparent/white backgrounds**
- **Solid-colored products** show better than patterns

### Adjustment Tips:
- Start with default settings
- If product is too small/large, adjust Size
- If product is too high/low, adjust Vertical Position
- If you can't see your body, reduce Opacity

## 🐛 Troubleshooting

**"No product images found on this page"**
- Make sure you're on a Myntra product detail page (not search results)
- Refresh the page and try again
- Some pages may have unusual layouts

**Try-on looks weird/misaligned**
- Adjust the Vertical Position slider
- Try a different product type setting
- Adjust product size
- Use a photo where you're standing straight

**Extension not loading**
- Check that extension is enabled in `chrome://extensions/`
- Refresh the Myntra page
- Make sure you're on myntra.com domain

**Images not replacing**
- Wait a few seconds after clicking "Create Virtual Try-On"
- Check browser console for errors (F12 → Console)
- Try uploading your photo again

## ⚠️ Limitations

- This is a **simple overlay tool**, not AI-powered body fitting
- Product may not perfectly align with your body shape
- Works best with **standard front-view product photos**
- CORS restrictions may prevent loading some images
- **Requires manual adjustment** of position/size for best fit

## 🔐 Privacy

- All image processing happens **locally in your browser**
- No images are uploaded to any server
- No data is stored permanently
- Extension only works when you activate it

## 📄 File Structure

```
MyntraVirtualTryOn/
├── manifest.json
├── popup.# tryon-ecom
