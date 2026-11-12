const { Kafka } = require('kafkajs');

function createKafkaClient() {
    const clientId = process.env.KAFKA_CLIENT_ID;
    const brokers = (process.env.KAFKA_BROKERS || '')
        .split(',')
        .map(broker => broker.trim())
        .filter(Boolean);

    if (!clientId) {
        throw new Error('KAFKA_CLIENT_ID is required');
    }
    if (!brokers.length) {
        throw new Error('KAFKA_BROKERS must contain at least one broker');
    }

    return new Kafka({ clientId, brokers });
}

module.exports = createKafkaClient;
