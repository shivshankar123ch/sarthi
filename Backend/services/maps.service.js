const axios = require('axios');
const captainModel = require('../models/captain.model');
const locationStream = require('./location-stream.service');

const CAPTAIN_SEARCH_RADIUS_KM = 2;

module.exports.CAPTAIN_SEARCH_RADIUS_KM = CAPTAIN_SEARCH_RADIUS_KM;

function getMapboxToken() {
    const token = process.env.MAPBOX_SECRET_TOKEN;
    if (!token) {
        const error = new Error('The server is missing its Mapbox access token.');
        error.code = 'MAPS_API_KEY_MISSING';
        throw error;
    }

    return token;
}

function mapboxRequestError(error, operation) {
    console.error(`Mapbox ${operation} request failed:`, error.response?.data?.message || error.code || 'unknown error');
    const requestError = new Error(`Mapbox ${operation} is temporarily unavailable.`);
    requestError.code = 'MAPS_SERVICE_UNAVAILABLE';
    return requestError;
}

module.exports.getAddressCoordinate = async (address) => {
    const token = getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;

    try {
        const response = await axios.get(url, {
            params: { access_token: token, limit: 1 }
        });
        const feature = response.data.features?.[ 0 ];
        if (feature?.center?.length === 2) {
            return {
                ltd: feature.center[ 1 ],
                lng: feature.center[ 0 ]
            };
        }

        const error = new Error('Could not find that location. Please select a more specific address.');
        error.code = 'MAPS_NO_RESULTS';
        throw error;
    } catch (error) {
        if (error.code?.startsWith('MAPS_')) {
            throw error;
        }
        throw mapboxRequestError(error, 'geocoding');
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    try {
        const token = getMapboxToken();
        const [ originCoordinates, destinationCoordinates ] = await Promise.all([
            module.exports.getAddressCoordinate(origin),
            module.exports.getAddressCoordinate(destination)
        ]);
        const coordinates = [
            `${originCoordinates.lng},${originCoordinates.ltd}`,
            `${destinationCoordinates.lng},${destinationCoordinates.ltd}`
        ].join(';');
        const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}`;
        const response = await axios.get(url, {
            params: { access_token: token, annotations: 'distance,duration' }
        });

        if (response.data.code && response.data.code !== 'Ok') {
            if (response.data.code === 'NoRoute') {
                const error = new Error('No route found between the selected locations.');
                error.code = 'MAPS_NO_ROUTE';
                throw error;
            }
            const error = new Error(`Mapbox directions failed: ${response.data.code}`);
            error.code = 'MAPS_SERVICE_UNAVAILABLE';
            throw error;
        }

        const distance = response.data.distances?.[ 0 ]?.[ 1 ];
        const duration = response.data.durations?.[ 0 ]?.[ 1 ];
        if (!Number.isFinite(distance) || !Number.isFinite(duration)) {
            const error = new Error('No route found between the selected locations.');
            error.code = 'MAPS_NO_ROUTE';
            throw error;
        }

        return {
            distance: {
                value: distance,
                text: `${(distance / 1000).toFixed(1)} km`
            },
            duration: {
                value: duration,
                text: `${Math.round(duration / 60)} mins`
            },
            status: 'OK'
        };
    } catch (error) {
        if (error.code?.startsWith('MAPS_')) {
            throw error;
        }
        throw mapboxRequestError(error, 'directions');
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const token = getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json`;

    try {
        const response = await axios.get(url, {
            params: { access_token: token, autocomplete: true, limit: 5 }
        });
        return (response.data.features || [])
            .map(feature => feature.place_name)
            .filter(Boolean);
    } catch (error) {
        throw mapboxRequestError(error, 'autocomplete');
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    if (
        !Number.isFinite(ltd) ||
        !Number.isFinite(lng) ||
        !Number.isFinite(radius) ||
        Math.abs(ltd) > 90 ||
        Math.abs(lng) > 180 ||
        radius <= 0
    ) {
        throw new Error('Invalid coordinates or search radius');
    }

    const latitudeRadians = ltd * Math.PI / 180;
    const latitudeDelta = radius / 111.32;
    const longitudeDelta = radius / (111.32 * Math.cos(latitudeRadians));
    const search = {
        'location.ltd': {
            $gte: Math.max(-90, ltd - latitudeDelta),
            $lte: Math.min(90, ltd + latitudeDelta)
        }
    };

    if (longitudeDelta < 180) {
        const minLongitude = lng - longitudeDelta;
        const maxLongitude = lng + longitudeDelta;

        if (minLongitude < -180) {
            search.$or = [
                { 'location.lng': { $gte: minLongitude + 360 } },
                { 'location.lng': { $lte: maxLongitude } }
            ];
        } else if (maxLongitude > 180) {
            search.$or = [
                { 'location.lng': { $gte: minLongitude } },
                { 'location.lng': { $lte: maxLongitude - 360 } }
            ];
        } else {
            search['location.lng'] = { $gte: minLongitude, $lte: maxLongitude };
        }
    }

    const liveLocations = await locationStream.getNearbyCaptainLocations({
        latitude: ltd,
        longitude: lng,
        radiusKm: radius
    });
    const liveCaptainIds = liveLocations.map(location => location.captainId);
    const captainSearch = liveCaptainIds.length
        ? { $or: [ search, { _id: { $in: liveCaptainIds } } ] }
        : search;
    const captains = await captainModel.find(captainSearch)
        .select('socketId fullname.firstname fullname.lastname vehicle.vehicleType location.ltd location.lng')
        .lean();
    const liveLocationsById = new Map(
        liveLocations.map(location => [ location.captainId, location ])
    );

    const toRadians = degrees => degrees * Math.PI / 180;
    const distanceInKm = (latitude, longitude) => {
        const latitudeDifference = toRadians(latitude - ltd);
        const longitudeDifference = toRadians(longitude - lng);
        const haversine = Math.min(1, Math.sin(latitudeDifference / 2) ** 2 +
            Math.cos(latitudeRadians) *
            Math.cos(toRadians(latitude)) *
            Math.sin(longitudeDifference / 2) ** 2);

        return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    };

    return captains
        .map(captain => {
            const liveLocation = liveLocationsById.get(String(captain._id));
            const latitude = liveLocation?.latitude ?? captain.location.ltd;
            const longitude = liveLocation?.longitude ?? captain.location.lng;
            return {
                ...captain,
                location: { ...captain.location, ltd: latitude, lng: longitude },
                isLive: Boolean(liveLocation),
                distanceKm: distanceInKm(latitude, longitude)
            };
        })
        .filter(captain => captain.distanceKm <= radius)
        .sort((first, second) => first.distanceKm - second.distanceKm);
};