import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Health check endpoint for monitoring
// @route   GET /api/health/ping
// @access  Public
export const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});
