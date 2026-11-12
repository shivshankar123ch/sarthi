const mongoose = require('mongoose');

const bucketName = 'rideVehiclePlateImages';
const imageTypes = {
    jpeg: { contentType: 'image/jpeg', extension: 'jpg' },
    png: { contentType: 'image/png', extension: 'png' },
    webp: { contentType: 'image/webp', extension: 'webp' }
};

function getBucket() {
    if (!mongoose.connection.db) {
        throw new Error('MongoDB must be connected before saving a vehicle plate image.');
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
}

function identifyImage(file) {
    const { buffer } = file;

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
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

    throw new Error('The vehicle number-plate file is not a valid JPEG, PNG, or WebP image.');
}

function storeRideVehiclePlateImage(file, rideId, captainId) {
    if (!file) {
        throw new Error('A vehicle number-plate image is required to start the ride.');
    }

    const image = identifyImage(file);
    const stream = getBucket().openUploadStream(
        `ride-${rideId}-vehicle-plate.${image.extension}`,
        {
            contentType: image.contentType,
            metadata: {
                rideId: rideId.toString(),
                captainId: captainId.toString(),
                imageType: 'vehiclePlateImage'
            }
        }
    );

    return new Promise((resolve, reject) => {
        stream.once('error', reject);
        stream.once('finish', () => resolve(stream.id));
        stream.end(file.buffer);
    });
}

async function deleteRideVehiclePlateImage(fileId) {
    await getBucket().delete(fileId);
}

module.exports = {
    deleteRideVehiclePlateImage,
    storeRideVehiclePlateImage
};
