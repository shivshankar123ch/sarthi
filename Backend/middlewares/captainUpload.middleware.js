const multer = require('multer');

const imageTypes = new Set([ 'image/jpeg', 'image/png', 'image/webp' ]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
        fields: 10,
        parts: 15
    },
    fileFilter: (req, file, callback) => {
        if (!imageTypes.has(file.mimetype)) {
            return callback(new Error('Upload JPEG, PNG, or WebP images only.'));
        }

        return callback(null, true);
    }
});

module.exports.uploadCaptainImages = (req, res, next) => {
    upload.fields([
        { name: 'aadhaarImage', maxCount: 1 },
        { name: 'panImage', maxCount: 1 },
        { name: 'drivingLicenceImage', maxCount: 1 },
        { name: 'captainPhotoImage', maxCount: 1 },
        { name: 'policeVerificationImage', maxCount: 1 }
    ])(req, res, error => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Each image must be 5 MB or smaller.'
                : 'Upload each document image only once.';
            return res.status(400).json({ message });
        }

        if (error.message === 'Upload JPEG, PNG, or WebP images only.') {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    });
};
