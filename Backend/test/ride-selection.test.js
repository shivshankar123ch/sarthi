const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const mapService = require('../services/maps.service');
const rideService = require('../services/ride.service');
const rideModel = require('../models/ride.model');
const socket = require('../socket');

const controllerPath = require.resolve('../controllers/ride.controller');
const originals = {
    getAddressCoordinate: mapService.getAddressCoordinate,
    getCaptainsInTheRadius: mapService.getCaptainsInTheRadius,
    createRide: rideService.createRide,
    confirmRide: rideService.confirmRide,
    findOne: rideModel.findOne,
    findOneAndUpdate: rideModel.findOneAndUpdate,
    sendMessageToSocketId: socket.sendMessageToSocketId
};

let controller;
let sentMessages;

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

beforeEach(() => {
    sentMessages = [];
    mapService.getAddressCoordinate = async () => ({ ltd: 40.7, lng: -73.9 });
    mapService.getCaptainsInTheRadius = async () => [];
    rideService.createRide = async () => {
        throw new Error('Unexpected ride creation');
    };
    rideService.confirmRide = async () => {
        throw new Error('Unexpected ride confirmation');
    };
    rideModel.findOne = () => ({
        populate: async () => ({ _id: 'ride-1', user: { _id: 'owner-1' } })
    });
    socket.sendMessageToSocketId = (socketId, message) => {
        sentMessages.push({ socketId, message });
    };
    delete require.cache[ controllerPath ];
    controller = require(controllerPath);
});

afterEach(() => {
    mapService.getAddressCoordinate = originals.getAddressCoordinate;
    mapService.getCaptainsInTheRadius = originals.getCaptainsInTheRadius;
    rideService.createRide = originals.createRide;
    rideService.confirmRide = originals.confirmRide;
    rideModel.findOne = originals.findOne;
    rideModel.findOneAndUpdate = originals.findOneAndUpdate;
    socket.sendMessageToSocketId = originals.sendMessageToSocketId;
    delete require.cache[ controllerPath ];
});

test('creates a ride for only the selected live captain and returns the owner OTP', async () => {
    const captainId = '507f1f77bcf86cd799439011';
    const createdRide = {
        _id: 'ride-1',
        pickup: 'Pickup',
        destination: 'Destination',
        fare: 100,
        status: 'pending',
        otp: '1234'
    };
    mapService.getCaptainsInTheRadius = async () => [
        { _id: 'other-captain', isLive: true, socketId: 'other-socket' },
        { _id: captainId, isLive: true, socketId: 'selected-socket' }
    ];
    rideService.createRide = async input => {
        assert.equal(String(input.captain), captainId);
        return createdRide;
    };

    const response = createResponse();
    await controller.createRide({
        body: { captainId, pickup: 'Pickup', destination: 'Destination', vehicleType: 'car' },
        user: { _id: 'owner-1' }
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.otp, '1234');
    assert.deepEqual(sentMessages.map(message => message.socketId), [ 'selected-socket' ]);
    assert.equal(sentMessages[ 0 ].message.event, 'new-ride');
    assert.equal(Object.prototype.hasOwnProperty.call(sentMessages[ 0 ].message.data, 'otp'), false);
});

test('rejects a captain that is no longer live before creating a ride', async () => {
    let didCreateRide = false;
    mapService.getCaptainsInTheRadius = async () => [
        { _id: '507f1f77bcf86cd799439011', isLive: false, socketId: 'stale-socket' }
    ];
    rideService.createRide = async () => {
        didCreateRide = true;
    };

    const response = createResponse();
    await controller.createRide({
        body: {
            captainId: '507f1f77bcf86cd799439011',
            pickup: 'Pickup',
            destination: 'Destination',
            vehicleType: 'car'
        },
        user: { _id: 'owner-1' }
    }, response);

    assert.equal(response.statusCode, 409);
    assert.equal(didCreateRide, false);
    assert.equal(sentMessages.length, 0);
});

test('sends the OTP to the owner but removes it from the captain response', async () => {
    const ride = {
        user: { socketId: 'owner-socket' },
        otp: '1234',
        toObject: () => ({ _id: 'ride-1', otp: '1234', status: 'accepted' })
    };
    rideService.confirmRide = async () => ride;

    const response = createResponse();
    await controller.confirmRide({
        body: { rideId: 'ride-1' },
        captain: { _id: 'captain-1' }
    }, response);

    assert.equal(sentMessages[ 0 ].socketId, 'owner-socket');
    assert.equal(sentMessages[ 0 ].message.data.otp, '1234');
    assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'otp'), false);
});

test('accepts a pending ride only for its assigned captain', async () => {
    rideService.confirmRide = originals.confirmRide;
    let queryFilter;
    const acceptedRide = { _id: 'ride-1', status: 'accepted' };
    rideModel.findOneAndUpdate = (filter, update, options) => {
        queryFilter = { filter, update, options };
        return {
            populate() {
                return this;
            },
            select: async () => acceptedRide
        };
    };

    const result = await rideService.confirmRide({
        rideId: 'ride-1',
        captain: { _id: 'captain-1' }
    });

    assert.deepEqual(queryFilter, {
        filter: { _id: 'ride-1', captain: 'captain-1', status: 'pending' },
        update: { status: 'accepted' },
        options: { new: true }
    });
    assert.equal(result, acceptedRide);
});
