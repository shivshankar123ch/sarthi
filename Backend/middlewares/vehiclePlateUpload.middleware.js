const multer = require('multer');

const imageTypes = new Set([ 'image/jpeg', 'image/png', 'image/webp' ]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 2,
        parts: 3
    },
    fileFilter: (req, file, callback) => {
        if (!imageTypes.has(file.mimetype)) {
            return callback(new Error('Upload a JPEG, PNG, or WebP number-plate image.'));
        }

        return callback(null, true);
    }
});

module.exports.uploadVehiclePlateImage = (req, res, next) => {
    upload.single('vehiclePlateImage')(req, res, error => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'The number-plate image must be 5 MB or smaller.'
                : 'Upload one number-plate image only.';
            return res.status(400).json({ message });
        }

        if (error.message === 'Upload a JPEG, PNG, or WebP number-plate image.') {
            return res.status(400).json({ message: error.message });
        }

        return next(error);
    });
};
