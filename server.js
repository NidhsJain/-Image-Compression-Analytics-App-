const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory:', uploadsDir);
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Routes
app.post('/api/compress', upload.single('image'), async (req, res) => {
  try {
    console.log('Received compression request');
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);
    
    const originalSize = req.file.size;
    const originalPath = req.file.path;
    const compressedPath = path.join(
      uploadsDir,
      'compressed-' + req.file.filename
    );

    console.log('Original path:', originalPath);
    console.log('Compressed path:', compressedPath);

    // Compress the image
    console.log('Starting image compression...');
    await sharp(originalPath)
      .jpeg({ quality: 80 })
      .toFile(compressedPath);
    console.log('Image compression completed');

    // Get compressed file size
    const compressedStats = fs.statSync(compressedPath);
    const compressedSize = compressedStats.size;
    console.log('Compressed size:', compressedSize);

    // Calculate compression ratio
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    console.log('Compression ratio:', compressionRatio + '%');

    res.json({
      originalSize,
      compressedSize,
      compressionRatio,
      originalPath: req.file.filename,
      compressedPath: 'compressed-' + req.file.filename
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    res.status(500).json({ error: `Error compressing image: ${error.message}` });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Add a test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
}); 