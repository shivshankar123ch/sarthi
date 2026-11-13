const { createClient } = require('redis');
const createKafkaClient = require('../kafka');

const CAPTAIN_LOCATIONS_KEY = 'captain:locations';
const LOCATION_KEY_PREFIX = 'captain:location:';
const LOCATION_TTL_SECONDS = 30;

let redisClient;
let producer;
let consumer;
let topic;

function isValidLocation(location) {
    return location &&
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude) &&
        Math.abs(location.latitude) <= 90 &&
        Math.abs(location.longitude) <= 180;
}

async function cacheLocation(client, captainId, location) {
    if (!captainId || !isValidLocation(location)) {
        throw new Error('Invalid captain location event');
    }

    const updatedAt = location.updatedAt || new Date().toISOString();
    const coordinates = {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt
    };

    await client.geoAdd(CAPTAIN_LOCATIONS_KEY, {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        member: captainId
    });
    await client.set(
        `${LOCATION_KEY_PREFIX}${captainId}`,
        JSON.stringify(coordinates),
        { EX: LOCATION_TTL_SECONDS }
    );
}

async function consumeLocationMessage(client, message, onLocationEvent) {
    if (!message.value) {
        console.error('Skipping empty captain location Kafka message');
        return;
    }

    let event;
    try {
        event = JSON.parse(message.value.toString());
    } catch (error) {
        console.error('Skipping invalid captain location Kafka JSON:', error.message);
        return;
    }

    if (
        !event ||
        typeof event !== 'object' ||
        !event.captainId ||
        !isValidLocation(event.location)
    ) {
        console.error('Skipping invalid captain location Kafka event');
        return;
    }

    await cacheLocation(client, event.captainId, event.location);
    await onLocationEvent(event);
}

module.exports.startLocationStream = async (onLocationEvent) => {
    if (typeof onLocationEvent !== 'function') {
        throw new Error('A Kafka location-event handler is required');
    }

    const requiredVariables = [
        'REDIS_HOST',
        'REDIS_PORT',
        'KAFKA_BROKERS',
        'KAFKA_CLIENT_ID',
        'KAFKA_TOPIC',
        'KAFKA_GROUP_ID'
    ];
    const missingVariables = requiredVariables.filter(variable => !process.env[ variable ]);
    if (missingVariables.length) {
        throw new Error(`Missing location-service configuration: ${missingVariables.join(', ')}`);
    }

    const redisPort = Number(process.env.REDIS_PORT);
    if (!Number.isInteger(redisPort) || redisPort < 1 || redisPort > 65535) {
        throw new Error('REDIS_PORT must be an integer between 1 and 65535');
    }

    const client = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: redisPort,
            connectTimeout: 5000,
            reconnectStrategy: retries => retries < 3
                ? (retries + 1) * 200
                : new Error('Redis connection retries exceeded')
        }
    });
    client.on('connect', () => console.log('Redis connecting...'));
    client.on('ready', () => console.log('Redis authenticated and ready!'));
    client.on('error', error => console.error('Redis client error:', error.message));

    const kafka = createKafkaClient();
    const kafkaProducer = kafka.producer();
    const kafkaConsumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID });

    try {
        await client.connect();
        await kafkaProducer.connect();
        await kafkaConsumer.connect();
        await kafkaConsumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: false });

        await kafkaConsumer.run({
            eachMessage: async ({ message }) => consumeLocationMessage(client, message, onLocationEvent)
        });

        redisClient = client;
        producer = kafkaProducer;
        consumer = kafkaConsumer;
        topic = process.env.KAFKA_TOPIC;
    } catch (error) {
        await Promise.allSettled([
            kafkaConsumer.disconnect(),
            kafkaProducer.disconnect(),
            client.quit()
        ]);
        throw error;
    }
};

module.exports.publishCaptainLocation = async (captainId, location) => {
    if (!redisClient || !producer || !topic) {
        throw new Error('Location stream has not been initialized');
    }
    if (!captainId || !isValidLocation(location)) {
        throw new Error('Invalid captain location');
    }

    const event = {
        captainId: String(captainId),
        location: {
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: new Date().toISOString()
        }
    };

    await cacheLocation(redisClient, event.captainId, event.location);
    await producer.send({
        topic,
        messages: [ {
            key: event.captainId,
            value: JSON.stringify(event)
        } ]
    });
};

module.exports.getNearbyCaptainLocations = async ({ latitude, longitude, radiusKm }) => {
    if (!redisClient) {
        throw new Error('Location stream has not been initialized');
    }

    const captainIds = await redisClient.geoSearch(
        CAPTAIN_LOCATIONS_KEY,
        { longitude, latitude },
        { radius: radiusKm, unit: 'km', SORT: 'ASC' }
    );
    if (!captainIds.length) {
        return [];
    }

    const cachedLocations = await redisClient.mGet(
        captainIds.map(captainId => `${LOCATION_KEY_PREFIX}${captainId}`)
    );

    return captainIds.reduce((locations, captainId, index) => {
        const cachedLocation = cachedLocations[ index ];
        if (cachedLocation) {
            locations.push({
                captainId,
                ...JSON.parse(cachedLocation)
            });
        }
        return locations;
    }, []);
};

module.exports.stopLocationStream = async () => {
    const activeConsumer = consumer;
    const activeProducer = producer;
    const activeRedisClient = redisClient;
    consumer = undefined;
    producer = undefined;
    redisClient = undefined;
    topic = undefined;

    const closeOperations = [];
    if (activeConsumer) closeOperations.push(activeConsumer.disconnect());
    if (activeProducer) closeOperations.push(activeProducer.disconnect());
    if (activeRedisClient) closeOperations.push(activeRedisClient.quit());

    const results = await Promise.allSettled(closeOperations);
    const failedClose = results.find(result => result.status === 'rejected');
    if (failedClose) {
        throw failedClose.reason;
    }
};
