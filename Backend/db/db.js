const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');

async function removeLegacyEmailIndex(model) {
    const indexes = await model.collection.indexes();
    const legacyEmailIndex = indexes.find(index =>
        index.key && index.key.email === 1 && Object.keys(index.key).length === 1
    );

    if (legacyEmailIndex) {
        await model.collection.dropIndex(legacyEmailIndex.name);
    }

    await model.createIndexes();
}

async function connectToDb() {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        throw new Error('MONGODB_URI is missing in environment variables');
    }

    await mongoose.connect(mongoURI);
    await Promise.all([ userModel.init(), captainModel.init() ]);
    await Promise.all([
        removeLegacyEmailIndex(userModel),
        removeLegacyEmailIndex(captainModel)
    ]);
    return mongoose.connection;
}


module.exports = connectToDb;