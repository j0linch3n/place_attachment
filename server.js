// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path'); // Needed to handle file paths
const Pin = require('./pins');
require('dotenv').config();

// Initialize express app
const app = express();

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'https://j0linch3n.github.io'
];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin like mobile apps, curl, Postman, etc.
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// // Use CORS middleware
// app.use(cors({
//   origin: 'http://127.0.0.1:5500, https://j0linch3n.github.io',
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type']
// }));

// Middleware to parse form data and JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer storage config — save images with original extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Folder to store uploaded images
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Serve uploaded images statically at /uploads
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.log('MongoDB connection error:', err));

// POST route to submit a new pin
app.post('/pins', upload.single('image'), (req, res) => {
  const { latitude, longitude, message, name, residence,  iconColor } = req.body;

  if (!latitude || !longitude || !message) {
    return res.status(400).json({ error: 'Missing required fields: latitude, longitude, and message are required.' });
  }

  // Save relative image path (e.g., /uploads/filename.jpg)
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const newPin = new Pin({
    latitude,
    longitude,
    message,
    name,
    residence,
    iconColor,
    image
  });

  newPin.save()
    .then(savedPin => res.status(201).json(savedPin))
    .catch(err => res.status(400).json({ error: 'Error creating pin', details: err }));
});

// GET route to fetch all pins
app.get('/pins', (req, res) => {
  Pin.find()
    .then(pins => res.status(200).json(pins))
    .catch(err => res.status(400).json({ error: 'Error retrieving pins', details: err }));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});