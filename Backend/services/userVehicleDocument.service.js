const mongoose = require('mongoose');

const bucketName = 'userVehicleDocuments';
const imageTypes = {
    jpeg: { contentType: 'image/jpeg', extension: 'jpg' },
    png: { contentType: 'image/png', extension: 'png' },
    webp: { contentType: 'image/webp', extension: 'webp' }
};
const requiredImageTypes = [
    'rcImage',
    'drivingLicenceImage',
    'insuranceImage',
    'pucImage'
];
const requiredOwnerImageTypes = [
    'ownerAadhaarImage',
    'ownerPanImage',
    'permitCertificateImage'
];
const optionalImageTypes = [
    'fitnessImage',
    'roadTaxImage',
    'nationalPermitImage',
    'goodsCarriagePermitImage',
    'loadChallanImage',
    'eWayBillImage'
];
const truckOnlyImageTypes = [
    'nationalPermitImage',
    'goodsCarriagePermitImage',
    'loadChallanImage',
    'eWayBillImage'
];
const userImageTypes = [ ...requiredImageTypes, ...optionalImageTypes, ...requiredOwnerImageTypes ];

function getBucket() {
    if (!mongoose.connection.db) {
        throw new Error('MongoDB must be connected before accessing user vehicle documents.');
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
}

function identifyImage(file) {
    const { buffer } = file;

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return imageTypes.jpeg;
    }

    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ]))
    ) {
        return imageTypes.png;
    }

    if (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return imageTypes.webp;
    }

    throw new Error(`${file.fieldname} must be a valid JPEG, PNG, or WebP image.`);
}

function uploadImage(file, imageType, userId) {
    const image = identifyImage(file);
    const bucket = getBucket();

    return new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(
            `${imageType}.${image.extension}`,
            {
                contentType: image.contentType,
                metadata: {
                    userId: userId.toString(),
                    imageType
                }
            }
        );

        stream.once('error', reject);
        stream.once('finish', () => resolve(stream.id));
        stream.end(file.buffer);
    });
}

function validateUserVehicleDocuments(files, vehicleType) {
    if (![ 'car', 'bolero', 'seven-seater-car', 'auto', 'truck' ].includes(vehicleType)) {
        throw new Error('Select a supported vehicle type.');
    }

    for (const imageType of requiredImageTypes) {
        const file = files[imageType]?.[0];
        if (!file) {
            throw new Error(`The ${imageType} document image is required.`);
        }
        identifyImage(file);
    }

    for (const imageType of requiredOwnerImageTypes) {
        const file = files[imageType]?.[0];
        if (!file) {
            throw new Error(`The ${imageType} document image is required.`);
        }
        identifyImage(file);
    }

    for (const imageType of optionalImageTypes) {
        const file = files[imageType]?.[0];
        if (file) {
            if (vehicleType !== 'truck' && truckOnlyImageTypes.includes(imageType)) {
                throw new Error(`${imageType} is only supported for truck registrations.`);
            }
            identifyImage(file);
        }
    }
}

async function deleteUserVehicleDocuments(fileIds) {
    const bucket = getBucket();
    const results = await Promise.allSettled(
        fileIds.map(fileId => bucket.delete(fileId))
    );
    const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

    if (errors.length) {
        throw new AggregateError(errors, 'Failed to delete uploaded user vehicle documents.');
    }
}

async function storeUserVehicleDocuments(files, userId, vehicleType) {
    validateUserVehicleDocuments(files, vehicleType);

    const stored = {};

    try {
        for (const imageType of userImageTypes) {
            if (!files[imageType]?.[0]) {
                continue;
            }
            stored[imageType] = await uploadImage(
                files[imageType][0],
                imageType,
                userId
            );
        }
    } catch (error) {
        const uploadedIds = Object.values(stored);
        if (uploadedIds.length) {
            try {
                await deleteUserVehicleDocuments(uploadedIds);
            } catch (cleanupError) {
                console.error('Failed to remove partially uploaded user vehicle documents:', cleanupError);
            }
        }
        throw error;
    }

    return stored;
}

async function findUserVehicleDocument(fileId, userId, imageType) {
    const files = await getBucket().find({
        _id: fileId,
        'metadata.userId': userId.toString(),
        'metadata.imageType': imageType
    }).toArray();

    return files[0] || null;
}

function openUserVehicleDocument(fileId) {
    return getBucket().openDownloadStream(fileId);
}

module.exports = {
    deleteUserVehicleDocuments,
    findUserVehicleDocument,
    openUserVehicleDocument,
    storeUserVehicleDocuments,
    validateUserVehicleDocuments
};
