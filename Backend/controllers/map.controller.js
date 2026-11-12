const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');

function sendMapError(res, error) {
    if (error.code === 'MAPS_NO_RESULTS' || error.code === 'MAPS_NO_ROUTE') {
        return res.status(422).json({ message: error.message });
    }
    if (
        error.code === 'MAPS_API_KEY_MISSING' ||
        error.code === 'MAPS_GEOCODING_DENIED' ||
        error.code === 'MAPS_GEOCODING_FAILED' ||
        error.code === 'MAPS_GEOCODING_UNAVAILABLE' ||
        error.code === 'MAPS_SERVICE_UNAVAILABLE'
    ) {
        console.error('Map request could not be completed:', error.code);
        return res.status(503).json({ message: error.message });
    }
    console.error('Map request failed:', error.message);
    return res.status(500).json({ message: 'Map data could not be loaded. Please try again later.' });
}

module.exports.getCoordinates = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }


    const { address } = req.query;

    try {
        const coordinates = await mapService.getAddressCoordinate(address);
        return res.status(200).json(coordinates);
    } catch (error) {
        return sendMapError(res, error);
    }
}

module.exports.getDistanceTime = async (req, res, next) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { origin, destination } = req.query;

        const distanceTime = await mapService.getDistanceTime(origin, destination);

        res.status(200).json(distanceTime);

    } catch (err) {
        return sendMapError(res, err);
    }
}

module.exports.getAutoCompleteSuggestions = async (req, res, next) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { input } = req.query;

        const suggestions = await mapService.getAutoCompleteSuggestions(input);

        res.status(200).json(suggestions);
    } catch (err) {
        return sendMapError(res, err);
    }
}

module.exports.getNearbyCaptains = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const coordinates = await mapService.getAddressCoordinate(req.query.address);
        const captains = await mapService.getCaptainsInTheRadius(
            coordinates.ltd,
            coordinates.lng,
            mapService.CAPTAIN_SEARCH_RADIUS_KM
        );

        return res.status(200).json({
            captains: captains
                .filter(captain => captain.isLive && captain.socketId)
                .map(captain => ({
                    _id: captain._id,
                    name: [ captain.fullname.firstname, captain.fullname.lastname ]
                        .filter(Boolean)
                        .join(' '),
                    vehicleType: captain.vehicle.vehicleType,
                    distanceKm: captain.distanceKm,
                    latitude: captain.location.ltd,
                    longitude: captain.location.lng
                }))
        });
    } catch (error) {
        if (error.code === 'MAPS_NO_RESULTS') {
            return res.status(422).json({ message: error.message });
        }
        return sendMapError(res, error);
    }
}