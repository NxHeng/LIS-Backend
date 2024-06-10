const userService = require('../services/userService');

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await userService.createUser(username, email, password);
        res.status(201).send('User created');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const authResponse = await userService.authenticateUser(email, password);
        if (authResponse.success) {
            res.json({ token: authResponse.token, user: authResponse.user });
        } else {
            res.status(400).send(authResponse.message);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getUserProfile = async (req, res) => {
    try {
        const user = await userService.getUserDetails(req.user.id);
        res.status(200).send(user);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
};

const logoutUser = async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        await userService.blacklistToken(token);
        res.status(200).send({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error.message);
        res.status(500).send({ message: 'Logout failed', error: error.message });
    }
};


const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    console.log("Old Password:", oldPassword);  // Debugging output
    console.log("New Password:", newPassword);  // Debugging output
    try {
        await userService.changePassword(req.user._id, oldPassword, newPassword);
        res.status(200).send({ message: 'Password successfully updated' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser,
    changePassword
};
