const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/tokenBlacklist');
const UserModel = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        // console.log('Authorization Header:', authHeader);

        if (!authHeader) {
            console.error('No Authorization header found');
            return res.status(401).send({ error: 'Authentication token is required' });
        }

        const token = authHeader.replace('Bearer ', '');
        // console.log('Token:', token);

        if (!token) {
            console.error('Malformed authentication token');
            return res.status(401).send({ error: 'Malformed authentication token' });
        }

        const blacklistedToken = await TokenBlacklist.findOne({ token });
        if (blacklistedToken) {
            console.error('Token is blacklisted');
            return res.status(401).send({ error: 'Token is blacklisted' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).send({ error: 'Token has expired. Please login again.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(400).send({ error: 'Malformed token' });
            }
            throw error;
        }
        // console.log('Decoded Token:', decoded);

        // if (!decoded || !decoded.id) {
        //     console.error('Invalid token');
        //     return res.status(401).send({ error: 'Invalid token' });
        // }

        const user = await UserModel.findById(decoded._id);
        // console.log('User:', user);
        if (!user) {
            console.error('User not found');
            return res.status(404).send({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.status(401).send({ error: 'Authentication failed', details: error.message });
    }
};

// // Middleware to check if user is admin
// const adminMiddleware = async (req, res, next) => {
//     try {
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Admin access required' });
//         }
//         next();
//     } catch (error) {
//         console.error('Admin middleware error:', error.message);
//         res.status(401).send({ error: 'Admin middleware failed', details: error.message });
//     }
// };

module.exports = authMiddleware;
