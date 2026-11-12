const { rateLimit } = require('express-rate-limit');

const sendPhoneOtpRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many OTP requests. Please try again later.' }
});

const verifyPhoneOtpRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many OTP verification attempts. Please try again later.' }
});

module.exports = { sendPhoneOtpRateLimit, verifyPhoneOtpRateLimit };
