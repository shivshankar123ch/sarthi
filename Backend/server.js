const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const connectToDb = require('./db/db');
const {
    startLocationStream,
    stopLocationStream
} = require('./services/location-stream.service');

dotenv.config({ path: path.join(__dirname, '.env') });

async function startServer() {
    await connectToDb();
    console.log('Connected to DB');

    const app = require('./app');
    const {
        initializeSocket,
        sendCaptainLocationToRider
    } = require('./socket');
    const port = process.env.PORT || 4000;
    const server = http.createServer(app);

    initializeSocket(server);
    await startLocationStream(sendCaptainLocationToRider);
    console.log('Connected to Redis and Kafka');

    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    const shutdown = async () => {
        server.close(async () => {
            try {
                await stopLocationStream();
                process.exitCode = 0;
            } catch (error) {
                console.error('Failed to close location services:', error.message);
                process.exitCode = 1;
            }
        });
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}

startServer().catch(error => {
    console.error('Failed to start backend:', error.message);
    process.exitCode = 1;
});