const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const TokenBlacklist = require('../models/tokenBlacklist');

const createStaff = async (username, email, password) => {
    const newUser = new UserModel({ username, email, password });
    return newUser.save();
};

const createClient = async (username, email, password, phone, ic) => {
    const newUser = new UserModel({ username, email, password, phone, ic });
    newUser.role = 'client-pending';
    return newUser.save();
};

const createUser = async (username, email, password, phone, ic, role) => {

    try {
        if (role === 'client') {
            if (!username || !email || !password || !phone || !ic) {
                throw new Error('All fields are required');
            }
        } else if (role !== 'client') {
            if (!username || !email || !password) {
                throw new Error('Missing username, email or password');
            }
        }

        // check if the email is already in use
        const existingUser = await UserModel.findOne({
            $or: [
                { email: { $eq: email, $ne: null, $ne: '' } },
                { phone: { $eq: phone, $ne: null, $ne: '' } },
                { ic: { $eq: ic, $ne: null, $ne: '' } }
            ]
        });

        if (existingUser) {
            console.log(existingUser);
            throw new Error('Email, phone or ic already in use');
        }

        //regex
        const phoneRegex = new RegExp('^[0-9]{10}$');
        const icRegex = new RegExp('^[0-9]{12}$');
        const emailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
        // const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})');


        if (!phoneRegex.test(phone) && role === 'client') {
            throw new Error('Invalid phone number');
        }

        if (!icRegex.test(ic) && role === 'client') {
            throw new Error('Invalid ic number');
        }

        if (!emailRegex.test(email)) {
            throw new Error('Invalid email');
        }

        // password must have at least 6 characters only
        if (password.length < 6) {
            throw new Error('Password must have at least 6 characters');
        }

        // if (!passwordRegex.test(password)) {
        //     throw new Error('Password must contain at least 8 characters, one uppercase, one lowercase, one number');
        // }

        if (!['admin', 'solicitor', 'clerk', 'client'].includes(role)) {
            throw new Error('Invalid role');
        }

        const newUser = new UserModel({ username, email, password, phone, ic, role });
        return newUser.save();
    } catch (error) {
        throw new Error(error.message);
    }
};

const authenticateUser = async (email, password) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    if (user.role === 'pending' || user.role === 'client-pending' || user.role === 'rejected') {
        if (user.role === 'pending' || user.role === 'client-pending') {
            return { success: false, message: 'Account is pending for approval' };
        } else {
            return { success: false, message: 'Account has been rejected' };
        }
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return { success: false, message: 'Invalid password' };
    }

    const token = jwt.sign(
        {
            _id: user._id,
            role: user.role,
            username: user.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h'
        });
    return { success: true, token, user };
};


const getUserDetails = async (userId) => {
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

const blacklistToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.exp) {
            throw new Error('Invalid token: Token does not contain expiration claim');
        }

        const expiresAt = new Date(decoded.exp * 1000); // Convert seconds to milliseconds
        if (isNaN(expiresAt.getTime())) {
            throw new Error('Invalid token: Failed to convert token expiration to a valid date');
        }

        const blacklistedToken = new TokenBlacklist({ token, expiresAt });
        await blacklistedToken.save();
        console.log('Token blacklisted successfully');
    } catch (error) {
        console.error('Error blacklisting token:', error.message);
        throw error; // Re-throw the error to be handled by the caller
    }
};


const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const match = await user.comparePassword(oldPassword);
    if (!match) {
        throw new Error('Old password does not match');
    }

    // Set the new password
    user.password = newPassword;
    // Save the user object, the pre('save') middleware will hash the new password
    await user.save();

    return user;
};

// get list of users with id and name
const getUserList = async () => {
    return UserModel.find({}, { _id: 1, username: 1, email: 1, role: 1, phone: 1, ic: 1 });
};

// get list of users with role of admin
const getAdminList = async () => {
    return UserModel.find({ role: 'admin' }, { _id: 1, username: 1, email: 1, role: 1 });
};

const updateRole = async (userId, role) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    return user;
};

const deleteUser = async (userId) => {
    try {
        const user = await UserModel.findByIdAndDelete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    catch (error) {
        throw error;
    }
}

const generatePasswordResetToken = async (email) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    return resetToken;
}

const sendPasswordResetEmail = async (email, resetToken) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request (Legal Information System)',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Legal Information System</h1>
                    <p style="margin: 0;">Password Reset Request</p>
                </div>
                <div style="padding: 20px; line-height: 1.6; color: #333;">
                    <p>Hello,</p>
                    <p>
                        You are receiving this email because you (or someone else) have requested to reset your account password. If this request was made by you, please click the button below to reset your password:
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
                    <p>
                        If you did not request this, please ignore this email. Your password will remain unchanged, and no action is needed.
                    </p>
                    <p>Thank you,<br>The Legal Information System Team</p>
                </div>
                <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

const sendNewAccountEmail = async (email, password, username, role) => {
    const uppercaseRole = role.charAt(0).toUpperCase() + role.slice(1);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const url = `${process.env.FRONTEND_URL}/login`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `${uppercaseRole} Account Created (Legal Information System)`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Legal Information System</h1>
                    <p style="margin: 0;">${uppercaseRole} Account Created</p>
                </div>
                <div style="padding: 20px; line-height: 1.6; color: #333;">
                    <p>Hello ${username},</p>
                    <p>
                        Your ${role} account has been successfully created. You can now log in to the Legal Information System using your email and a temporary password.
                        Be sure to change your password after logging in for the first time.
                        <br/><Strong>Temporary Password: ${password}</Strong>
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                            Login to Legal Information System
                        </a>
                    </div>
                    <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; color: #4CAF50;">${url}</p>
                    <p>
                        If you have any questions or need assistance, please contact our support team at <a href="mailto:${process.env.EMAIL_USER}" style="color: #4CAF50; text-decoration: none;">${process.env.EMAIL_USER}</a>.
                    </p>
                    <p>Thank you,<br>The Legal Information System Team</p>
                </div>
                <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    }
    );
}


const resetPassword = async (resetToken, newPassword) => {
    const user = await UserModel.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired token');
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();
}

module.exports = {
    createStaff,
    createClient,
    createUser,
    authenticateUser,
    getUserDetails,
    blacklistToken,
    changePassword,
    getUserList,
    getAdminList,
    updateRole,
    deleteUser,
    generatePasswordResetToken,
    sendPasswordResetEmail,
    resetPassword,
    sendNewAccountEmail
};
