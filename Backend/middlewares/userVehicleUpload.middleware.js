const multer = require('multer');

const imageTypes = new Set([ 'image/jpeg', 'image/png', 'image/webp' ]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 13,
        fields: 10,
        parts: 20
    },
    fileFilter: (req, file, callback) => {
        if (!imageTypes.has(file.mimetype)) {
            return callback(new Error('Upload JPEG, PNG, or WebP images only.'));
        }

        return callback(null, true);
    }
});

module.exports.uploadUserVehicleDocuments = (req, res, next) => {
    upload.fields([
        { name: 'rcImage', maxCount: 1 },
        { name: 'drivingLicenceImage', maxCount: 1 },
        { name: 'insuranceImage', maxCount: 1 },
        { name: 'pucImage', maxCount: 1 },
        { name: 'fitnessImage', maxCount: 1 },
        { name: 'roadTaxImage', maxCount: 1 },
        { name: 'nationalPermitImage', maxCount: 1 },
        { name: 'goodsCarriagePermitImage', maxCount: 1 },
        { name: 'loadChallanImage', maxCount: 1 },
        { name: 'eWayBillImage', maxCount: 1 },
        { name: 'ownerAadhaarImage', maxCount: 1 },
        { name: 'ownerPanImage', maxCount: 1 },
        { name: 'permitCertificateImage', maxCount: 1 }
    ])(req, res, error => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Each document image must be 5 MB or smaller.'
                : 'Upload each document image only once.';
            return res.status(400).json({ message });
        }

        if (error.message === 'Upload JPEG, PNG, or WebP images only.') {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    });
};
