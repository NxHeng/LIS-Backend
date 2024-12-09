const express = require('express');
const fileMiddleware = require('../middlewares/fileMiddleware');

const {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    fetchAttachment,
    deleteAttachment,

} = require('../controllers/announcementController');

const router = express.Router();

//Case Routes
router.get('/getAnnouncements', getAnnouncements);
router.get('/getAnnouncement/:id', getAnnouncement);
router.post('/createAnnouncement', fileMiddleware.single('attachment'), createAnnouncement);
router.patch('/updateAnnouncement/:id', updateAnnouncement);
router.delete('/deleteAnnouncement/:id', deleteAnnouncement);
router.get('/fetchAttachment/:URI', fetchAttachment);
router.delete('/deleteAttachment/:URI', deleteAttachment);

module.exports = router;