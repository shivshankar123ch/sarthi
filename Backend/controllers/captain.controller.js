const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const twoFactorOtpService = require('../services/twoFactorOtp.service');
const blackListTokenModel = require('../models/blackListToken.model');
const {
    deleteCaptainDocuments,
    findCaptainDocument,
    openCaptainDocument,
    storeCaptainDocuments,
    validateCaptainDocuments
} = require('../services/captainDocument.service');
const { validationResult } = require('express-validator');


module.exports.registerCaptain = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, phone, alternatePhone, password, vehicle } = req.body;
    const files = req.files || {};

    if (
        !files.aadhaarImage?.[0] ||
        !files.panImage?.[0] ||
        !files.captainPhotoImage?.[0] ||
        !files.policeVerificationImage?.[0]
    ) {
        return res.status(400).json({ message: 'Aadhaar, PAN, captain photo, and Police Verification Certificate images are required.' });
    }

    try {
        validateCaptainDocuments(files);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    const isCaptainAlreadyExist = await captainModel.findOne({ phone });

    if (isCaptainAlreadyExist) {
        return res.status(400).json({ message: 'Captain already exist' });
    }


    const hashedPassword = await captainModel.hashPassword(password);

    const captainId = new captainModel()._id;
    let uploadedDocuments;
    let captain;

    try {
        uploadedDocuments = await storeCaptainDocuments(files, captainId);
        captain = await captainService.createCaptain({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            phone,
            alternatePhone,
            password: hashedPassword,
            aadhaarImage: uploadedDocuments.aadhaarImage,
            panImage: uploadedDocuments.panImage,
            drivingLicenceImage: uploadedDocuments.drivingLicenceImage,
            captainPhotoImage: uploadedDocuments.captainPhotoImage,
            policeVerificationImage: uploadedDocuments.policeVerificationImage,
            vehicleType: vehicle.vehicleType,
            carCategory: vehicle.carCategory,
            carModel: vehicle.carModel,
            autoCategory: vehicle.autoCategory,
            autoModel: vehicle.autoModel,
            truckCategory: vehicle.truckCategory,
            truckModel: vehicle.truckModel,
            _id: captainId
        });

        const token = captain.generateAuthToken();
        return res.status(201).json({ token, captain });
    } catch (error) {
        if (uploadedDocuments) {
            if (captain) {
                await captainModel.deleteOne({ _id: captain._id }).catch(cleanupError => {
                    console.error('Failed to remove captain after registration failed:', cleanupError);
                });
            }
            try {
                await deleteCaptainDocuments(Object.values(uploadedDocuments));
            } catch (cleanupError) {
                console.error('Failed to remove captain documents after registration failed:', cleanupError);
            }
        }
        return next(error);
    }

}

module.exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    const captain = await captainModel.findOne({ phone }).select('+password');

    if (!captain) {
        return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, captain });
}

module.exports.sendCaptainPhoneOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const ticket = await twoFactorOtpService.sendOtp(req.body.phone, 'captain');
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
}

module.exports.verifyCaptainPhoneOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const phone = await twoFactorOtpService.verifyOtp(req.body.ticket, req.body.otp, 'captain');
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
}

module.exports.loginCaptainWithPhoneOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const phone = await twoFactorOtpService.verifyOtp(req.body.ticket, req.body.otp, 'captain');
        const captain = await captainModel.findOne({ phone });

        if (!captain) {
            return res.status(404).json({ message: 'No captain account is registered with this mobile number' });
        }

        const token = captain.generateAuthToken();
        res.cookie('token', token);
        return res.status(200).json({ token, captain });
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

module.exports.getCaptainProfile = async (req, res, next) => {
    res.status(200).json({ captain: req.captain });
}

module.exports.getCaptainDocument = async (req, res, next) => {
    const documentTypes = new Map([
        [ 'aadhaar', { fileId: req.captain.documents?.aadhaarImage, imageType: 'aadhaarImage' } ],
        [ 'pan', { fileId: req.captain.documents?.panImage, imageType: 'panImage' } ],
        [ 'driving-licence', { fileId: req.captain.documents?.drivingLicenceImage, imageType: 'drivingLicenceImage' } ],
        [ 'captain-photo', { fileId: req.captain.documents?.captainPhotoImage, imageType: 'captainPhotoImage' } ],
        [ 'police-verification', { fileId: req.captain.documents?.policeVerificationImage, imageType: 'policeVerificationImage' } ]
    ]);
    const document = documentTypes.get(req.params.documentType);

    if (!document?.fileId) {
        return res.status(404).json({ message: 'Document not found' });
    }

    try {
        const file = await findCaptainDocument(
            document.fileId,
            req.captain._id,
            document.imageType
        );

        if (!file) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.set({
            'Cache-Control': 'private, no-store',
            'Content-Disposition': [ 'vehicle', 'captain-photo' ].includes(req.params.documentType)
                ? 'inline'
                : 'attachment',
            'Content-Type': file.contentType,
            'X-Content-Type-Options': 'nosniff'
        });

        const stream = openCaptainDocument(file._id);
        stream.on('error', next);
        return stream.pipe(res);
    } catch (error) {
        return next(error);
    }
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    await blackListTokenModel.create({ token });

    res.clearCookie('token');

    res.status(200).json({ message: 'Logout successfully' });
}