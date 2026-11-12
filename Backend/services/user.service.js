const userModel = require('../models/user.model');
const autoVehicles = require('../constants/autoVehicles');
const carVehicles = require('../constants/carVehicles');
const truckVehicles = require('../constants/truckVehicles');


module.exports.createUser = async ({
    _id, firstname, lastname, phone, alternatePhone, password, vehicleType,
    carCategory, carModel, autoCategory, autoModel, truckCategory, truckModel, vehicleDocuments
}) => {
    if (!firstname || !phone || !password || !vehicleType || !vehicleDocuments) {
        throw new Error('All fields are required');
    }
    if (
        vehicleType === 'car' &&
        !carVehicles[carCategory]?.includes(carModel)
    ) {
        throw new Error('A supported car category and model are required');
    }
    if (
        vehicleType === 'auto' &&
        !autoVehicles[autoCategory]?.includes(autoModel)
    ) {
        throw new Error('A supported auto category and model are required');
    }
    if (
        vehicleType === 'truck' &&
        !truckVehicles[truckCategory]?.includes(truckModel)
    ) {
        throw new Error('A supported truck category and model are required');
    }
    return userModel.create({
        _id,
        fullname: {
            firstname,
            lastname
        },
        phone,
        alternatePhone,
        password,
        vehicleType,
        ...(vehicleType === 'car' ? { carCategory, carModel } : {}),
        ...(vehicleType === 'auto' ? { autoCategory, autoModel } : {}),
        ...(vehicleType === 'truck' ? { truckCategory, truckModel } : {}),
        vehicleDocuments
    });
}