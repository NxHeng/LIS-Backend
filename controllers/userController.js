const userService = require('../services/userService');

const staffRegister = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await userService.createStaff(username, email, password);
        res.status(201).json('User created');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const clientRegister = async (req, res) => {
    const { username, email, password, phone, ic } = req.body;
    try {
        await userService.createClient(username, email, password, phone, ic);
        res.status(201).json('Client created');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const userRegister = async (req, res) => {
    const { username, email, password, phone, ic, role } = req.body;
    try {
        // await userService.createUser(username, email, password, phone, ic, role);
        await userService.createUser(username, email, password, phone, ic, role);
        await userService.sendNewAccountEmail(email, password, username, role);
        res.status(201).json('User created');
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
            res.status(400).json({ message: authResponse.message });
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

//get user list with id and name
const getUserList = async (req, res) => {
    try {
        const users = await userService.getUserList();
        res.status(200).send(users);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
};

const updateRole = async (req, res) => {
    const { userId, role } = req.body;
    try {
        const user = await userService.updateRole(userId, role);
        res.status(200).send(user);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    const { userId } = req.body;
    try {
        await userService.deleteUser(userId);
        res.status(200).send('User deleted successfully');
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const resetToken = await userService.generatePasswordResetToken(email);
        await userService.sendPasswordResetEmail(email, resetToken);
        res.status(200).send({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        await userService.resetPassword(token, newPassword);
        res.status(200).send({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};


module.exports = {
    staffRegister,
    clientRegister,
    userRegister,
    loginUser,
    getUserProfile,
    logoutUser,
    changePassword,
    getUserList,
    updateRole,
    deleteUser,
    forgotPassword,
    resetPassword
};
