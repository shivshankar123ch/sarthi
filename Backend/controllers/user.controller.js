const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const twoFactorOtpService = require('../services/twoFactorOtp.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blackListToken.model');
const {
    deleteUserVehicleDocuments,
    findUserVehicleDocument,
    openUserVehicleDocument,
    storeUserVehicleDocuments,
    validateUserVehicleDocuments
} = require('../services/userVehicleDocument.service');

module.exports.registerUser = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        fullname,
        phone,
        alternatePhone,
        password,
        vehicleType,
        carCategory,
        carModel,
        autoCategory,
        autoModel,
        truckCategory,
        truckModel
    } = req.body;
    const files = req.files || {};

    try {
        validateUserVehicleDocuments(files, vehicleType);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    const isUserAlready = await userModel.findOne({ phone });

    if (isUserAlready) {
        return res.status(400).json({ message: 'User already exist' });
    }

    const hashedPassword = await userModel.hashPassword(password);
    const userId = new userModel()._id;
    let uploadedDocuments;
    let user;

    try {
        uploadedDocuments = await storeUserVehicleDocuments(files, userId, vehicleType);
        user = await userService.createUser({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            phone,
            alternatePhone,
            password: hashedPassword,
            vehicleType,
            carCategory,
            carModel,
            autoCategory,
            autoModel,
            truckCategory,
            truckModel,
            vehicleDocuments: uploadedDocuments,
            _id: userId
        });

        const token = user.generateAuthToken();
        return res.status(201).json({ token, user });
    } catch (error) {
        if (uploadedDocuments) {
            if (user) {
                await userModel.deleteOne({ _id: user._id }).catch(cleanupError => {
                    console.error('Failed to remove user after registration failed:', cleanupError);
                });
            }
            await deleteUserVehicleDocuments(Object.values(uploadedDocuments)).catch(cleanupError => {
                console.error('Failed to remove user vehicle documents after registration failed:', cleanupError);
            });
        }
        return next(error);
    }

}

module.exports.loginUser = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    const user = await userModel.findOne({ phone }).select('+password');

    if (!user) {
        return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const token = user.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, user });
}

module.exports.sendUserPhoneOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const ticket = await twoFactorOtpService.sendOtp(req.body.phone, 'user');
        return res.status(200).json({ ticket });
    } catch (error) {
        if (error instanceof twoFactorOtpService.TwoFactorConfigurationError) {
            return res.status(503).json({ message: '2Factor OTP is not configured on the server' });
        }
        if (error instanceof twoFactorOtpService.TwoFactorProviderError) {
            return res.status(502).json({ message: 'OTP could not be sent. Please try again later.' });
        }
        return next(error);
    }
};

module.exports.verifyUserPhoneOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const phone = await twoFactorOtpService.verifyOtp(req.body.ticket, req.body.otp, 'user');
        return res.status(200).json({ verified: true, phone });
    } catch (error) {
        if (error instanceof twoFactorOtpService.TwoFactorConfigurationError) {
            return res.status(503).json({ message: '2Factor OTP is not configured on the server' });
        }
        if (
            error instanceof twoFactorOtpService.InvalidOtpTicketError ||
            error instanceof twoFactorOtpService.InvalidOtpError
        ) {
            return res.status(401).json({ message: 'Invalid or expired phone verification' });
        }
        if (error instanceof twoFactorOtpService.TwoFactorProviderError) {
            return res.status(502).json({ message: 'OTP verification could not be completed. Please try again later.' });
        }
        return next(error);
    }
};

module.exports.loginUserWithPhoneOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const phone = await twoFactorOtpService.verifyOtp(req.body.ticket, req.body.otp, 'user');
        const user = await userModel.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: 'No account is registered with this mobile number' });
        }
        const token = user.generateAuthToken();
        res.cookie('token', token);
        return res.status(200).json({ token, user });
    } catch (error) {
        if (error instanceof twoFactorOtpService.TwoFactorConfigurationError) {
            return res.status(503).json({ message: '2Factor OTP is not configured on the server' });
        }
        if (
            error instanceof twoFactorOtpService.InvalidOtpTicketError ||
            error instanceof twoFactorOtpService.InvalidOtpError
        ) {
            return res.status(401).json({ message: 'Invalid or expired phone verification' });
        }
        if (error instanceof twoFactorOtpService.TwoFactorProviderError) {
            return res.status(502).json({ message: 'OTP verification could not be completed. Please try again later.' });
        }
        return next(error);
    }
}

module.exports.getUserProfile = async (req, res, next) => {

    res.status(200).json(req.user);

}

module.exports.getUserDocument = async (req, res, next) => {
    const documentTypes = new Map([
        [ 'rc', 'rcImage' ],
        [ 'driving-licence', 'drivingLicenceImage' ],
        [ 'insurance', 'insuranceImage' ],
        [ 'puc', 'pucImage' ],
        [ 'fitness', 'fitnessImage' ],
        [ 'road-tax', 'roadTaxImage' ],
        [ 'national-permit', 'nationalPermitImage' ],
        [ 'goods-carriage-permit', 'goodsCarriagePermitImage' ],
        [ 'load-challan', 'loadChallanImage' ],
        [ 'e-way-bill', 'eWayBillImage' ],
        [ 'owner-aadhaar', 'ownerAadhaarImage' ],
        [ 'owner-pan', 'ownerPanImage' ],
        [ 'permit-certificate', 'permitCertificateImage' ]
    ]);
    const imageType = documentTypes.get(req.params.documentType);
    const fileId = imageType && req.user.vehicleDocuments?.[imageType];

    if (!fileId) {
        return res.status(404).json({ message: 'Document not found' });
    }

    try {
        const file = await findUserVehicleDocument(fileId, req.user._id, imageType);
        if (!file) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.set({
            'Cache-Control': 'private, no-store',
            'Content-Disposition': 'attachment',
            'Content-Type': file.contentType,
            'X-Content-Type-Options': 'nosniff'
        });

        const stream = openUserVehicleDocument(file._id);
        stream.on('error', next);
        return stream.pipe(res);
    } catch (error) {
        return next(error);
    }
}

module.exports.logoutUser = async (req, res, next) => {
    res.clearCookie('token');
    const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];

    await blackListTokenModel.create({ token });

    res.status(200).json({ message: 'Logged out' });

}