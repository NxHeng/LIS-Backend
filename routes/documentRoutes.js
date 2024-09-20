const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const fileMiddleware = require('../middlewares/fileMiddleware');

// Routes
router.post('/upload', fileMiddleware.single('file'), documentController.uploadFile);
router.post('/createFolder', documentController.createFolder);
router.get('/listContents', documentController.listContents);
router.get('/downloadFile', documentController.downloadFile);
router.delete('/deleteFile', documentController.deleteFile);

module.exports = router;
