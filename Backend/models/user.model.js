const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const autoVehicles = require('../constants/autoVehicles');
const carVehicles = require('../constants/carVehicles');
const truckVehicles = require('../constants/truckVehicles');

const autoModels = Object.values(autoVehicles).flat();
const carModels = Object.values(carVehicles).flat();
const truckModels = Object.values(truckVehicles).flat();


const userSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength: [ 3, 'First name must be at least 3 characters long' ],
        },
        lastname: {
            type: String,
            minlength: [ 3, 'Last name must be at least 3 characters long' ],
        }
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        match: [ /^\+[1-9]\d{7,14}$/, 'Please enter a valid phone number with country code' ],
    },
    alternatePhone: {
        type: String,
        select: false,
        match: [ /^\+[1-9]\d{7,14}$/, 'Please enter a valid alternate phone number with country code' ]
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    vehicleType: {
        type: String,
        enum: [ 'car', 'bolero', 'seven-seater-car', 'auto', 'truck' ],
    },
    autoCategory: {
        type: String,
        enum: Object.keys(autoVehicles),
    },
    autoModel: {
        type: String,
        enum: autoModels,
    },
    carCategory: {
        type: String,
        enum: Object.keys(carVehicles),
    },
    carModel: {
        type: String,
        enum: carModels,
    },
    truckCategory: {
        type: String,
        enum: Object.keys(truckVehicles),
    },
    truckModel: {
        type: String,
        enum: truckModels,
    },
    vehicleDocuments: {
        rcImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        drivingLicenceImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        insuranceImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        pucImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        fitnessImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        roadTaxImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        nationalPermitImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        goodsCarriagePermitImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        loadChallanImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        eWayBillImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        ownerAadhaarImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        ownerPanImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        },
        permitCertificateImage: {
            type: mongoose.Schema.Types.ObjectId,
            select: false
        }
    },
    socketId: {
        type: String,
    },
})

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return token;
}

userSchema.set('toJSON', {
    transform: (document, result) => {
        delete result.password;
        delete result.vehicleDocuments;
        return result;
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model('user', userSchema);


module.exports = userModel;