const captainController = require('../controllers/captain.controller');
const express = require('express');
const router = express.Router();
const { body } = require("express-validator")
const authMiddleware = require('../middlewares/auth.middleware');
const { uploadCaptainImages } = require('../middlewares/captainUpload.middleware');
const autoVehicles = require('../constants/autoVehicles');
const carVehicles = require('../constants/carVehicles');
const truckVehicles = require('../constants/truckVehicles');
const {
    sendPhoneOtpRateLimit,
    verifyPhoneOtpRateLimit
} = require('../middlewares/phoneOtpRateLimit.middleware');


router.post('/register', uploadCaptainImages, [
    body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code'),
    body('alternatePhone').optional().matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid alternate mobile number with country code'),
    body('fullname.firstname').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('vehicle.vehicleType').isIn([ 'car', 'bolero', 'seven-seater-car', 'truck', 'auto' ]).withMessage('Invalid vehicle type'),
    body('vehicle.carCategory')
        .if(body('vehicle.vehicleType').equals('car'))
        .isIn(Object.keys(carVehicles))
        .withMessage('Select a supported car category'),
    body('vehicle.carModel')
        .if(body('vehicle.vehicleType').equals('car'))
        .custom((model, { req }) => carVehicles[req.body.vehicle?.carCategory]?.includes(model))
        .withMessage('Select a supported car model'),
    body('vehicle.autoCategory')
        .if(body('vehicle.vehicleType').equals('auto'))
        .isIn(Object.keys(autoVehicles))
        .withMessage('Select a supported auto category'),
    body('vehicle.autoModel')
        .if(body('vehicle.vehicleType').equals('auto'))
        .custom((model, { req }) => autoVehicles[req.body.vehicle?.autoCategory]?.includes(model))
        .withMessage('Select a supported auto model'),
    body('vehicle.truckCategory')
        .if(body('vehicle.vehicleType').equals('truck'))
        .isIn(Object.keys(truckVehicles))
        .withMessage('Select a supported truck category'),
    body('vehicle.truckModel')
        .if(body('vehicle.vehicleType').equals('truck'))
        .custom((model, { req }) => truckVehicles[req.body.vehicle?.truckCategory]?.includes(model))
        .withMessage('Select a supported truck model')
],
    captainController.registerCaptain
)


router.post('/login', [
    body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
],
    captainController.loginCaptain
)

router.post('/otp/send', sendPhoneOtpRateLimit, [
    body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code')
],
    captainController.sendCaptainPhoneOtp
)

router.post('/otp/verify', verifyPhoneOtpRateLimit, [
    body('ticket').isString().isLength({ min: 1, max: 2048 }).withMessage('A valid OTP session is required'),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the six-digit verification code')
],
    captainController.verifyCaptainPhoneOtp
)

router.post('/login/phone-otp', verifyPhoneOtpRateLimit, [
    body('ticket').isString().isLength({ min: 1, max: 2048 }).withMessage('A valid OTP session is required'),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the six-digit verification code')
],
    captainController.loginCaptainWithPhoneOtp
)


router.get('/documents/:documentType', authMiddleware.authCaptain, captainController.getCaptainDocument)

router.get('/profile', authMiddleware.authCaptain, captainController.getCaptainProfile)

router.get('/logout', authMiddleware.authCaptain, captainController.logoutCaptain)


module.exports = router;