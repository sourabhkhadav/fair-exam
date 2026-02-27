import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';

export const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!token || token === 'null' || token === 'undefined') {
                res.status(401);
                throw new Error('Invalid token');
            }
            
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (jwtError) {
                res.status(401);
                throw new Error('Invalid or malformed token');
            }
            
            if (decoded.id === 'demo-user-id') {
                req.user = {
                    id: 'demo-user-id',
                    _id: 'demo-user-id',
                    name: 'Demo User',
                    email: 'demo@fairexam.com',
                    role: 'examiner'
                };
            } else if (decoded.candidateId) {
                // Candidate token
                req.candidate = await Candidate.findById(decoded.candidateId);
                req.examId = decoded.examId;
                if (!req.candidate) {
                    res.status(401);
                    throw new Error('Candidate not found');
                }
            } else {
                // User token
                const foundUser = await User.findById(decoded.id).select('-password');
                if (!foundUser) {
                    res.status(401);
                    throw new Error('User not found - Please login again');
                }
                req.user = {
                    id: foundUser._id.toString(),
                    _id: foundUser._id,
                    name: foundUser.name,
                    email: foundUser.email,
                    role: foundUser.role
                };
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

export const authorize = (...roles) => {
    return (req, res, next) => {
        // Skip authorization if no roles specified
        if (!roles.length) {
            return next();
        }
        
        // Check if user exists and has required role
        if (!req.user) {
            res.status(403);
            throw new Error('Access denied - User authentication required');
        }
        
        if (!roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role ${req.user.role} is not authorized to access this route`);
        }
        next();
    };
};
