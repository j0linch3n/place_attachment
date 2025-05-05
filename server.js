// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');  // Import cors here
const Pin = require('./pins'); // Assuming you have a Pin model in pins.js
require('dotenv').config(); // Load environment variables from .env file

// Initialize express app
const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Middleware to parse incoming JSON data
app.use(express.json()); // This allows your API to accept JSON requests
app.use(express.urlencoded({ extended: true })); // This allows your API to accept form data

// Set up multer for file upload (if needed)
const upload = multer({ dest: 'uploads/' }); // Temporary file storage

// Use the MONGO_URI from the .env file to connect to MongoDB
const MONGO_URI = process.env.MONGO_URI; 

// Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.log('MongoDB connection error:', err));

// POST route to submit a new pin (latitude, longitude, message, image, etc.)
app.post('/pins', upload.single('image'), (req, res) => {
  // Extracting all necessary data from the request body
  const { latitude, longitude, message, name, residence } = req.body;

  // Validate required fields
  if (!latitude || !longitude || !message) {
    return res.status(400).json({ error: 'Missing required fields: latitude, longitude, and message are required.' });
  }

  // Handle image upload (if any)
  const image = req.file ? req.file.path : null;

  // Create a new pin and save to the database
  const newPin = new Pin({
    latitude,
    longitude,
    message,
    name,
    residence,
    image
  });

  newPin.save()
    .then(() => res.status(201).json({ message: 'Pin created successfully!' }))
    .catch(err => res.status(400).json({ error: 'Error creating pin', details: err }));
});

// GET route to fetch all pins
app.get('/pins', (req, res) => {
  Pin.find()
    .then(pins => res.status(200).json(pins)) // Send back all pins as JSON
    .catch(err => res.status(400).json({ error: 'Error retrieving pins', details: err }));
});

// Serve static files (e.g., images, CSS, JS) from the public folder
app.use(express.static('public')); // Assuming you have a public folder

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});