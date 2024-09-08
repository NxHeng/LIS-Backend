const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile', authMiddleware, userController.getUserProfile);
router.post('/logout', authMiddleware, userController.logoutUser);
router.post('/changePassword', authMiddleware, userController.changePassword);

router.get('/getUserList', userController.getUserList);

module.exports = router;
