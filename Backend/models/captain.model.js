const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength: [ 3, 'Firstname must be at least 3 characters long' ],
        },
        lastname: {
            type: String,
            minlength: [ 3, 'Lastname must be at least 3 characters long' ],
        }
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        match: [ /^\+[1-9]\d{7,14}$/, 'Please enter a valid phone number with country code' ]
    },
    alternatePhone: {
        type: String,
        match: [ /^\+[1-9]\d{7,14}$/, 'Please enter a valid alternate phone number with country code' ]
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    socketId: {
        type: String,
    },

    status: {
        type: String,
        enum: [ 'active', 'inactive' ],
        default: 'inactive',
    },

    vehicle: {
        plate: {
            type: String,
            minlength: [ 3, 'Plate must be at least 3 characters long' ],
        },
        capacity: {
            type: Number,
            required: true,
            min: [ 0, 'Capacity cannot be negative' ],
        },
        vehicleType: {
            type: String,
            required: true,
            enum: [ 'car', 'bolero', 'seven-seater-car', 'truck', 'auto' ],
        },
        carCategory: String,
        carModel: String,
        autoCategory: String,
        autoModel: String,
        truckCategory: String,
        truckModel: String
    },

    documents: {
        aadhaarImage: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            select: false
        },
        panImage: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            select: false
        },
        drivingLicenceImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        captainPhotoImage: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            select: false
        },
        policeVerificationImage: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            select: false
        }
    },

    location: {
        ltd: {
            type: Number,
        },
        lng: {
            type: Number,
        }
    }
})


captainSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return token;
}

captainSchema.set('toJSON', {
    transform: (document, result) => {
        delete result.password;
        delete result.documents;
        return result;
    }
});


captainSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}


captainSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const captainModel = mongoose.model('captain', captainSchema)


module.exports = captainModel;