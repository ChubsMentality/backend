const mongoose = require('mongoose')

const pickupMsgSchema = mongoose.Schema(
    {
        email: {
            type: String,
        },

        pickupDate: {
            type: String
        },

        pickupTime: {
            type: String,
        },

        animalName: {
            type: String,
        },

        adopterName: {
            type: String,
        },

        adoptionReference: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
)

const PickupMsg = mongoose.model('PickupMsg', pickupMsgSchema)
module.exports = PickupMsg