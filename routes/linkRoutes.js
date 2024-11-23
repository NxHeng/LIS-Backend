// routes/linkRoutes.js
const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');

// Generate temporary link
router.post('/generate-link', linkController.generateLink);

// Validate link
router.get('/validate-link/:token', linkController.validateLink);

module.exports = router;
