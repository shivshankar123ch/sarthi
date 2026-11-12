const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { captainId, pickup, destination, vehicleType } = req.body;

    try {
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        const captainsInRadius = await mapService.getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            mapService.CAPTAIN_SEARCH_RADIUS_KM
        );
        const selectedCaptain = captainsInRadius.find(captain =>
            String(captain._id) === String(captainId) && captain.isLive && captain.socketId
        );

        if (!selectedCaptain) {
            return res.status(409).json({
                message: 'That captain is no longer available. Select another live captain.'
            });
        }

        const ride = await rideService.createRide({
            user: req.user._id,
            captain: selectedCaptain._id,
            pickup,
            destination,
            vehicleType
        });
        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        sendMessageToSocketId(selectedCaptain.socketId, {
            event: 'new-ride',
            data: rideWithUser
        });

        return res.status(201).json({
            _id: ride._id,
            pickup: ride.pickup,
            destination: ride.destination,
            fare: ride.fare,
            status: ride.status,
            otp: ride.otp
        });
    } catch (error) {
        if (error.code === 'MAPS_NO_RESULTS') {
            return res.status(422).json({ message: error.message });
        }
        if (
            error.code === 'MAPS_API_KEY_MISSING' ||
            error.code === 'MAPS_GEOCODING_UNAVAILABLE' ||
            error.code === 'MAPS_SERVICE_UNAVAILABLE'
        ) {
            console.error('Selected captain could not be verified:', error.code);
            return res.status(503).json({ message: error.message });
        }
        console.error('Ride request failed:', error.message);
        return res.status(500).json({ message: 'Ride could not be requested. Please try again.' });
    }

};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        const captainResponse = ride.toObject();
        delete captainResponse.otp;
        return res.status(200).json(captainResponse);
    } catch (err) {

        if (err.message === 'Ride is no longer available or assigned to another captain') {
            return res.status(409).json({ message: err.message });
        }
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'A vehicle number-plate image is required.' });
    }

    const { rideId, otp } = req.body;

    try {
        const ride = await rideService.startRide({
            rideId,
            otp,
            captain: req.captain,
            vehiclePlateImage: req.file
        });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        const captainResponse = ride.toObject();
        delete captainResponse.otp;
        return res.status(200).json(captainResponse);
    } catch (err) {
        if (err.message === 'Invalid OTP' || err.message.includes('image') || err.message.includes('JPEG')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message === 'Ride not found') {
            return res.status(404).json({ message: err.message });
        }
        if (err.message === 'Ride not accepted' || err.message.includes('could not be started')) {
            return res.status(409).json({ message: err.message });
        }
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })

        const captainResponse = ride.toObject();
        delete captainResponse.otp;
        return res.status(200).json(captainResponse);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    } s
}