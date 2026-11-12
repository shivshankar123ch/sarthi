const captainModel = require('../models/captain.model');
const autoVehicles = require('../constants/autoVehicles');
const carVehicles = require('../constants/carVehicles');
const truckVehicles = require('../constants/truckVehicles');

const vehicleCapacities = {
    car: 4,
    bolero: 7,
    'seven-seater-car': 7,
    auto: 3,
    truck: 0
};

module.exports.createCaptain = async ({
    _id, firstname, lastname, phone, alternatePhone, password, aadhaarImage, panImage,
    drivingLicenceImage, captainPhotoImage, policeVerificationImage, vehicleType,
    carCategory, carModel, autoCategory, autoModel, truckCategory, truckModel
}) => {
    if (
        !firstname ||
        !phone ||
        !password ||
        !aadhaarImage ||
        !panImage ||
        !captainPhotoImage ||
        !policeVerificationImage ||
        !vehicleType
    ) {
        throw new Error('All fields are required');
    }
    const capacity = vehicleCapacities[vehicleType];
    if (capacity === undefined) {
        throw new Error('Invalid vehicle type');
    }
    if (vehicleType === 'car' && !carVehicles[carCategory]?.includes(carModel)) {
        throw new Error('Invalid car category or model');
    }
    if (vehicleType === 'auto' && !autoVehicles[autoCategory]?.includes(autoModel)) {
        throw new Error('Invalid auto category or model');
    }
    if (vehicleType === 'truck' && !truckVehicles[truckCategory]?.includes(truckModel)) {
        throw new Error('Invalid truck category or model');
    }

    return captainModel.create({
        _id,
        fullname: {
            firstname,
            lastname
        },
        phone,
        alternatePhone,
        password,
        vehicle: {
            capacity,
            vehicleType,
            ...(vehicleType === 'car' ? { carCategory, carModel } : {}),
            ...(vehicleType === 'auto' ? { autoCategory, autoModel } : {}),
            ...(vehicleType === 'truck' ? { truckCategory, truckModel } : {})
        },
        documents: {
            aadhaarImage,
            panImage,
            drivingLicenceImage,
            captainPhotoImage,
            policeVerificationImage
        }
    })
}