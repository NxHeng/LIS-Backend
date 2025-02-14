const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// router.post('/register', userController.staffRegister);
// router.post('/clientRegister', userController.clientRegister);
router.post('/userRegister', userController.userRegister);  
router.post('/login', userController.loginUser);
router.get('/profile', authMiddleware, userController.getUserProfile);
router.post('/logout', authMiddleware, userController.logoutUser);
router.post('/changePassword', authMiddleware, userController.changePassword);

router.get('/getUserList', userController.getUserList);
router.patch('/updateRole', userController.updateRole);
router.delete('/deleteUser', userController.deleteUser);

// Password reset routes
router.post('/forgotPassword', userController.forgotPassword);
router.post('/resetPassword', userController.resetPassword);

module.exports = router;
