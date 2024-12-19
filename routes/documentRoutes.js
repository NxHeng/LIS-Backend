const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const fileMiddleware = require('../middlewares/fileMiddleware');

// Routes
router.post('/upload', fileMiddleware.single('file'), documentController.uploadFile);
router.post('/createFolder', documentController.createFolder);
router.get('/listContents', documentController.listContents);
router.get('/listFolders', documentController.listFolders);
router.get('/listEverything', documentController.listEverything);
router.get('/downloadFile', documentController.downloadFile);
router.delete('/deleteFile', documentController.deleteFile);
router.delete('/deleteFolder', documentController.deleteFolder);
router.patch('/renameFolder', documentController.renameFolder);
router.patch('/renameFile', documentController.renameFile);
router.get('/previewFile', documentController.previewFile);
router.patch('/moveFile', documentController.moveFile);
router.patch('/moveFolder', documentController.moveFolder);

module.exports = router;
