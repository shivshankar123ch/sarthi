const mongoose = require('mongoose');

const bucketName = 'captainDocuments';
const imageTypes = {
    jpeg: { contentType: 'image/jpeg', extension: 'jpg' },
    png: { contentType: 'image/png', extension: 'png' },
    webp: { contentType: 'image/webp', extension: 'webp' }
};
const captainImageTypes = [
    'aadhaarImage',
    'panImage',
    'drivingLicenceImage',
    'captainPhotoImage',
    'policeVerificationImage'
];

function getBucket() {
    if (!mongoose.connection.db) {
        throw new Error('MongoDB must be connected before accessing captain documents.');
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

function uploadImage(file, imageType, captainId) {
    const image = identifyImage(file);
    const bucket = getBucket();

    return new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(
            `${imageType}.${image.extension}`,
            {
                contentType: image.contentType,
                metadata: {
                    captainId: captainId.toString(),
                    imageType
                }
            }
        );

        stream.once('error', reject);
        stream.once('finish', () => resolve(stream.id));
        stream.end(file.buffer);
    });
}

function validateCaptainDocuments(files) {
    const drivingLicenceImage = files.drivingLicenceImage?.[0];
    if (!drivingLicenceImage) {
        throw new Error('The Driving Licence (DL) image is required.');
    }
    identifyImage(drivingLicenceImage);

    const captainPhotoImage = files.captainPhotoImage?.[0];
    if (!captainPhotoImage) {
        throw new Error("The captain's photo is required.");
    }
    identifyImage(captainPhotoImage);

    const policeVerificationImage = files.policeVerificationImage?.[0];
    if (!policeVerificationImage) {
        throw new Error('The Police Verification Certificate image is required.');
    }
    identifyImage(policeVerificationImage);
}

async function deleteCaptainDocuments(fileIds) {
    const bucket = getBucket();
    const results = await Promise.allSettled(
        fileIds.map(fileId => bucket.delete(fileId))
    );
    const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

    if (errors.length) {
        throw new AggregateError(errors, 'Failed to delete uploaded captain documents.');
    }
}

async function storeCaptainDocuments(files, captainId) {
    validateCaptainDocuments(files);

    const stored = {};

    try {
        for (const imageType of captainImageTypes) {
            if (!files[imageType]?.[0]) {
                continue;
            }
            stored[imageType] = await uploadImage(
                files[imageType][0],
                imageType,
                captainId
            );
        }
    } catch (error) {
        const uploadedIds = Object.values(stored);
        if (uploadedIds.length) {
            try {
                await deleteCaptainDocuments(uploadedIds);
            } catch (cleanupError) {
                console.error('Failed to remove partially uploaded captain documents:', cleanupError);
            }
        }
        throw error;
    }

    return stored;
}

async function findCaptainDocument(fileId, captainId, imageType) {
    const files = await getBucket().find({
        _id: fileId,
        'metadata.captainId': captainId.toString(),
        'metadata.imageType': imageType
    }).toArray();

    return files[0] || null;
}

function openCaptainDocument(fileId) {
    return getBucket().openDownloadStream(fileId);
}

module.exports = {
    deleteCaptainDocuments,
    findCaptainDocument,
    openCaptainDocument,
    storeCaptainDocuments,
    validateCaptainDocuments
};
