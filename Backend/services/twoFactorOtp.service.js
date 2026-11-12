const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE_URL = 'https://2factor.in/API/V1';
const TICKET_ISSUER = 'sarthi-backend';

class TwoFactorConfigurationError extends Error {
    constructor() {
        super('2Factor OTP is not configured on the server');
        this.name = 'TwoFactorConfigurationError';
    }
}

class InvalidOtpTicketError extends Error {
    constructor() {
        super('Invalid or expired OTP verification session');
        this.name = 'InvalidOtpTicketError';
    }
}

class InvalidOtpError extends Error {
    constructor() {
        super('Invalid or expired OTP');
        this.name = 'InvalidOtpError';
    }
}

class TwoFactorProviderError extends Error {
    constructor() {
        super('The OTP provider could not complete the request');
        this.name = 'TwoFactorProviderError';
    }
}

function getConfiguration() {
    if (!process.env.TWO_FACTOR_API_KEY || !process.env.JWT_SECRET) {
        throw new TwoFactorConfigurationError();
    }

    return {
        apiKey: process.env.TWO_FACTOR_API_KEY,
        jwtSecret: process.env.JWT_SECRET
    };
}

function getApiUrl(apiKey, ...segments) {
    return [
        API_BASE_URL,
        encodeURIComponent(apiKey),
        'SMS',
        ...segments.map(segment => encodeURIComponent(segment))
    ].join('/');
}

async function requestProvider(url) {
    let response;
    try {
        response = await axios.get(url, { timeout: 10000 });
    } catch {
        throw new TwoFactorProviderError();
    }

    if (!response.data || response.data.Status !== 'Success') {
        const details = String(response.data?.Details || '');
        if (/otp\s*(mismatch|invalid|expired)|invalid\s*otp/i.test(details)) {
            throw new InvalidOtpError();
        }
        throw new TwoFactorProviderError();
    }

    return response.data;
}

async function sendOtp(phone, accountType) {
    const { apiKey, jwtSecret } = getConfiguration();
    const providerPhone = phone.slice(1);
    const result = await requestProvider(getApiUrl(apiKey, providerPhone, 'AUTOGEN'));

    if (typeof result.Details !== 'string' || !result.Details) {
        throw new TwoFactorProviderError();
    }

    const ticket = jwt.sign(
        {
            purpose: 'phone-login',
            accountType,
            phone,
            providerSessionId: result.Details
        },
        jwtSecret,
        { expiresIn: '10m', issuer: TICKET_ISSUER }
    );

    return ticket;
}

async function verifyOtp(ticket, otp, accountType) {
    const { apiKey, jwtSecret } = getConfiguration();
    let session;

    try {
        session = jwt.verify(ticket, jwtSecret, { issuer: TICKET_ISSUER });
    } catch {
        throw new InvalidOtpTicketError();
    }

    if (
        session.purpose !== 'phone-login' ||
        session.accountType !== accountType ||
        typeof session.phone !== 'string' ||
        !/^\+[1-9]\d{7,14}$/.test(session.phone) ||
        typeof session.providerSessionId !== 'string' ||
        !session.providerSessionId
    ) {
        throw new InvalidOtpTicketError();
    }

    const result = await requestProvider(
        getApiUrl(apiKey, 'VERIFY', session.providerSessionId, otp)
    );
    if (String(result.Details).toLowerCase() !== 'otp matched') {
        throw new InvalidOtpError();
    }

    return session.phone;
}

module.exports = {
    sendOtp,
    verifyOtp,
    TwoFactorConfigurationError,
    InvalidOtpTicketError,
    InvalidOtpError,
    TwoFactorProviderError
};
