const express = require('express');
const router = express.Router();
const { body } = require("express-validator")
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { uploadUserVehicleDocuments } = require('../middlewares/userVehicleUpload.middleware');
const autoVehicles = require('../constants/autoVehicles');
const carVehicles = require('../constants/carVehicles');
const truckVehicles = require('../constants/truckVehicles');
const {
    sendPhoneOtpRateLimit,
    verifyPhoneOtpRateLimit
} = require('../middlewares/phoneOtpRateLimit.middleware');


router.post('/register', uploadUserVehicleDocuments, [
    body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code'),
    body('alternatePhone').optional().matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid alternate mobile number with country code'),
    body('fullname.firstname').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('vehicleType').isIn([ 'car', 'bolero', 'seven-seater-car', 'auto', 'truck' ]).withMessage('Select a supported vehicle type'),
    body('carCategory')
        .if(body('vehicleType').equals('car'))
        .isIn(Object.keys(carVehicles))
        .withMessage('Select a supported car category'),
    body('carModel')
        .if(body('vehicleType').equals('car'))
        .custom((model, { req }) => carVehicles[req.body.carCategory]?.includes(model))
        .withMessage('Select a supported car model'),
    body('autoCategory')
        .if(body('vehicleType').equals('auto'))
        .isIn(Object.keys(autoVehicles))
        .withMessage('Select a supported auto category'),
    body('autoModel')
        .if(body('vehicleType').equals('auto'))
        .custom((model, { req }) => autoVehicles[req.body.autoCategory]?.includes(model))
        .withMessage('Select a supported auto model'),
    body('truckCategory')
        .if(body('vehicleType').equals('truck'))
        .isIn(Object.keys(truckVehicles))
        .withMessage('Select a supported truck category'),
    body('truckModel')
        .if(body('vehicleType').equals('truck'))
        .custom((model, { req }) => truckVehicles[req.body.truckCategory]?.includes(model))
        .withMessage('Select a supported truck model')
],
    userController.registerUser
)

router.post('/login', [
    body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
],
    userController.loginUser
)

router.post('/otp/send', sendPhoneOtpRateLimit, [
    body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code')
],
    userController.sendUserPhoneOtp
)

router.post('/otp/verify', verifyPhoneOtpRateLimit, [
    body('ticket').isString().isLength({ min: 1, max: 2048 }).withMessage('A valid OTP session is required'),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the six-digit verification code')
],
    userController.verifyUserPhoneOtp
)

router.post('/login/phone-otp', verifyPhoneOtpRateLimit, [
    body('ticket').isString().isLength({ min: 1, max: 2048 }).withMessage('A valid OTP session is required'),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the six-digit verification code')
],
    userController.loginUserWithPhoneOtp
)

router.get('/profile', authMiddleware.authUser, userController.getUserProfile)

router.get('/documents/:documentType', authMiddleware.authUser, userController.getUserDocument)

router.get('/logout', authMiddleware.authUser, userController.logoutUser)



module.exports = router;