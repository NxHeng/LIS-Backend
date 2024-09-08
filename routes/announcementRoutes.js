const express = require('express');
const {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router();

//Case Routes
router.get('/getAnnouncements', getAnnouncements);
router.get('/getAnnouncement/:id', getAnnouncement);
router.post('/createAnnouncement', createAnnouncement);
router.patch('/updateAnnouncement/:id', updateAnnouncement);
router.delete('/deleteAnnouncement/:id', deleteAnnouncement);

module.exports = router;