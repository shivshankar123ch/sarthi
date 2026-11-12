const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const rideModel = require('./models/ride.model');
const locationStream = require('./services/location-stream.service');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);


        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
            }
        });


        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (
                !location ||
                !Number.isFinite(location.ltd) ||
                !Number.isFinite(location.lng) ||
                Math.abs(location.ltd) > 90 ||
                Math.abs(location.lng) > 180
            ) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            try {
                const captain = await captainModel.findByIdAndUpdate(userId, {
                    location: {
                        ltd: location.ltd,
                        lng: location.lng
                    }
                });
                if (!captain) {
                    return socket.emit('error', { message: 'Captain account not found' });
                }

                await locationStream.publishCaptainLocation(userId, {
                    latitude: location.ltd,
                    longitude: location.lng
                });
            } catch (error) {
                console.error('Captain location update failed:', error.message);
                socket.emit('error', { message: 'Captain location could not be published' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

async function sendCaptainLocationToRider(event) {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }

    const activeRides = await rideModel.find({
        captain: event.captainId,
        status: 'ongoing'
    }).select('_id user').populate('user', 'socketId').lean();

    activeRides.forEach(ride => {
        if (ride.user?.socketId) {
            io.to(ride.user.socketId).emit('driver-location', {
                rideId: String(ride._id),
                captainId: event.captainId,
                location: event.location
            });
        }
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = {
    initializeSocket,
    sendMessageToSocketId,
    sendCaptainLocationToRider
};