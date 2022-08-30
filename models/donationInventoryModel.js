const mongoose = require('mongoose')

const inventorySchema = mongoose.Schema(
    {
        dataItems: {
            type: [Object]
        },

        donatedBy: {
            type: String,
            required: true,
        },

        email: {
            type: String,
        },

        contactNo: {
            type: String,
        },

        donatedByPicture: {
            type: String,
        },

        dateOfDonation: {
            type: String,
            required: true,
        },

        proofOfDonation: {
            type: String,
        },

        recevied: {
            type: Boolean,
        },

        donationId: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
)

const DonationInventory = mongoose.model('DonationInventory', inventorySchema)
module.exports = DonationInventory