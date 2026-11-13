const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const connectToDb = require('./db/db');
const {
    startLocationStream,
    stopLocationStream
} = require('./services/location-stream.service');

dotenv.config({ path: path.join(__dirname, '.env') });

async function closeBackend(server) {
    let failed = false;
    try {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    } catch (error) {
        failed = true;
        console.error('Failed to close HTTP server:', error.message);
    }

    const results = await Promise.allSettled([ stopLocationStream(), mongoose.disconnect() ]);

    const failures = results.filter(result => result.status === 'rejected');
    failures.forEach(result => {
        failed = true;
        console.error('Failed to close backend service:', result.reason.message);
    });

    return !failed;
}

async function startServer() {
    const app = require('./app');
    const {
        initializeSocket,
        sendCaptainLocationToRider
    } = require('./socket');
    const port = process.env.PORT || 4000;
    const server = http.createServer(app);

    initializeSocket(server);

    await new Promise((resolve, reject) => {
        const handleError = error => reject(error);
        server.once('error', handleError);
        server.listen(port, () => {
            server.removeListener('error', handleError);
            console.log(`Server is running on port ${port}`);
            resolve();
        });
    });

    try {
        await connectToDb();
        console.log('Connected to DB');

        await startLocationStream(sendCaptainLocationToRider);
        console.log('Connected to Redis and Kafka');
    } catch (error) {
        console.error('Failed to start backend:', error.message);
        process.exitCode = 1;
        await closeBackend(server);
        return;
    }

    const shutdown = async () => {
        process.exitCode = await closeBackend(server) ? 0 : 1;
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}

startServer().catch(error => {
    console.error('Failed to start backend:', error.message);
    process.exitCode = 1;
});