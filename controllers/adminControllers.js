const Admin = require('../models/adminModel');
const Animal = require ('../models/animalModel') // The animal model
const UserFeedback = require('../models/userFeedbackModel')
const User = require('../models/userModel')
const Donation = require('../models/donationModel')
const DonationInventory = require('../models/donationInventoryModel.js')
const StrayAnimalReport = require('../models/strayAnimalReport')
const RegisterAnimal = require('../models/animalRegistrationModel')
const Adoption = require('../models/adoptionModel')
const InterviewSched = require('../models/interviewSchedModel')
const asyncHandler = require('express-async-handler');
const { generateToken, generateResetPasswordToken } = require('../utils/generateToken');
const { emailTransport } = require('../utils/verifyUserUtils')
const { sendInterviewSchedTemplate, pickupTemplate, rejectAdoptionTemplate, registerAnimalTemplate, feedbackHasBeenReadTemplate } = require('../utils/emailTemplates');
const ResetPasswordToken = require('../models/resetPasswordToken');
const { generateResetPasswordTemplate, plainEmailTemplate } = require('../utils/resetPasswordUtil')


// Sending Email via Google Auth 0Auth2
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2

const googleCreds = {
    user: 'furryhope.mail@gmail.com',
    clientId: '550307509735-o1k2nff0tkelnu7dfhh4tgntfk1r4ohb.apps.googleusercontent.com',
    clientSecret: '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',
    refreshToken: '1//04GjTgjIj0cvyCgYIARAAGAQSNwF-L9IrVFKItJxMErKq8ZMK0M3JQTZrHU4P2MosYrPhDKM4NhAjRyaSkNDP4z-u1z71ERB_4Gg'
}

const OAuth2_client = new OAuth2(googleCreds.clientId, googleCreds.clientSecret) // clientId, clientSecret
OAuth2_client.setCredentials({ refresh_token: googleCreds.refreshToken }) // Setting the refresh token

const accessToken = OAuth2_client.getAccessToken()

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: googleCreds.user,
        clientId: googleCreds.clientId,
        clientSecret: googleCreds.clientSecret,
        refreshToken: googleCreds.refreshToken,
        accessToken: accessToken
    }
})
// Sending Email via Google Auth 0Auth2 -- END


const registerAdmin = asyncHandler(async (req, res) => {
    const { fullName, email, contactNo, address, password, jobPosition, role, profilePicture } = req.body;

    // To check if an admin account exists
    const adminExists = await Admin.findOne({ email });

    // If an admin account already exists, we throw in an error
    if (adminExists) {
        res.status(400);
        throw new Error('Admin already exists.');
    }
    // If there's no equal admin account then create a new admin account
    // to create a new admin account
    const admin = await Admin.create({
        fullName,
        email,
        contactNo,
        address,
        password,
        jobPosition,
        role,
        profilePicture
    });

    // If the admin account was successfully created
    if (admin) {
        res.status(201).json({
            id: admin.id,
            fullName: admin.fullName,
            email: admin.email,
            contactNo: admin.contactno,
            address: admin.address,
            jobPosition: admin.jobPosition,
            role: admin.role,
            profilePicture: admin.profilePicture,
            token: generateToken(admin.id),
        })
    // If not an error occurs
    } else {
        res.status(400)
        throw new Error('Error Occured')
    }

    res.json({
        fullName,
        email,
        contactNo,
        address,
        jobPosition,
        role,
        profilePicture,
    });
});

const getAdminInfo = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id)

    if(!admin) {
        res.status(404)
        throw new Error('Could not find admin account')
    } else {
        res.json(admin)
    }
})

// Authenticating the account (logging in)
const authAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Finds the admin in the db
    const adminAcc = await Admin.findOne({ email });

    if(adminAcc.accountStatus === 'Disabled') throw new Error('The account has been disabled')

    if (adminAcc && (await adminAcc.matchPassword(password))) {
        res.json({
            id: adminAcc.id,
            fullName: adminAcc.fullName,
            email: adminAcc.email,
            contactNo: adminAcc.contactNo,
            address: adminAcc.address,
            jobPosition: adminAcc.jobPosition,
            role: adminAcc.role,
            profilePicture: adminAcc.profilePicture,
            token: generateToken(adminAcc.id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid Username or Password');
    }
});

const disableAdmin = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id)

    if(admin) {
        admin.accountStatus = 'Disabled'
        const updated = admin.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Could not find admin account.')
    }
})

const enableAdmin = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id)

    if(admin) {
        admin.accountStatus = 'Active'
        const updated = admin.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Could not find admin account.')
    }
})

const getFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await UserFeedback.find()
    res.json(feedbacks);
})

const getFeedback = asyncHandler(async (req, res) => {
    const feedback = await UserFeedback.findById(req.params.id)

    if(feedback) {
        res.json(feedback)
    } else {
        res.status(404)
        throw new Error(`Couldn't find feedback.`)
    }
})

const deleteFeedback = asyncHandler(async (req, res) => {
    const feedback = await UserFeedback.findById(req.params.id)

    if(feedback) {
        await feedback.remove()
        res.json({ message: 'Successfully removed'})
    }
})

const updateFeedbackRead = asyncHandler(async (req, res) => {
    const { profilePicture, message, email } = req.body
    const feedback = await UserFeedback.findById(req.params.id)
    const viewed = true
    
    if(feedback) {
        feedback.viewed = viewed
        const updated = feedback.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Could not find specific feedback (Invalid ID)')
    }

    let mailOptions = {
        from: 'furryhope.mail@gmail.com',
        to: email,
        subject: 'Marikina Veterinary Office - Your pet has been registered to the vet office.',
        html: feedbackHasBeenReadTemplate(profilePicture, message)
    }

    transport.sendMail(mailOptions, (error, result) => {
        if (error) {
            console.log(error)
        } else {
            console.log(`Success: ${result}`)
        }

        transport.close()
    })
})

const getPendingReports = asyncHandler(async (req, res) => {
    const reports = await StrayAnimalReport.find({ status: 'Pending' })
    res.json(reports)
})

const getDismissedReports = asyncHandler(async (req, res) => {
    const reports = await StrayAnimalReport.find({ status: 'Dismissed' })
    res.json(reports)
})

const reportHasBeenRead = asyncHandler(async (req, res) => {
    const report = await StrayAnimalReport.findById(req.params.id)

    if(report) {
        report.viewed = true
        const updated = report.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Could not find report. (Possible Invalid ID)')
    }
})

const getSpecificReport = asyncHandler(async (req, res) => {
    const report = await StrayAnimalReport.findById(req.params.id)

    if(report) {
        res.json(report)
    } else {
        res.status(404).json({ message: 'Could not find specific report.' })
    }
})

const dismissReport = asyncHandler(async (req, res) => {
    const { status } = req.body

    const report = await StrayAnimalReport.findById(req.params.id)
    if(report) {
        report.status = status
        const dismissedReport = await report.save()
        res.json(dismissedReport) 
    } else {
        res.status(404)
        throw new Error('Stray animal report was not found')
    }
})

const deleteReport = asyncHandler(async (req, res) => {
    const report = await StrayAnimalReport.findById(req.params.id)

    if(report) {
        await report.remove()
        res.json({ message: 'Successfully removed'})
    }
})

const getAllRegistrations = asyncHandler(async (req, res) => {
    const registrations = await RegisterAnimal.find()
    res.json(registrations)
})

const getRegistration = asyncHandler(async (req, res) => {
    const registration = await RegisterAnimal.findById(req.params.id)

    if(registration) {
        res.json(registration)
    } else {
        res.status(404)
        throw new Error('Could not find registration (Invalid ID)')
    }
})

const getPendingRegistrations = asyncHandler(async (req, res) => {
    const registrations = await RegisterAnimal.find({ registrationStatus: 'Pending' })
    res.json(registrations)
})

const getRegisteredPets = asyncHandler(async (req, res) => {
    const registrations = await RegisterAnimal.find({ registrationStatus: 'Registered' })
    res.json(registrations)
})

const getNotRegisteredPets = asyncHandler(async (req, res) => {
    const registrations = await RegisterAnimal.find({ registrationStatus: 'Not Registered' })
    res.json(registrations)
})

// const updateRegRequirements = asyncHandler(async (req, res) => {
//     const { } = req.body
//     const registration = await RegisterAnimal.findById(req.params.id)
// })

const deleteRegistration = asyncHandler(async (req, res) => {
    const registration = await RegisterAnimal.findById(req.params.id)

    if(registration) {
        await registration.remove()
        res.json({ message: 'Successfully removed'})
    }
})

const registerAnimal = asyncHandler(async (req, res) => {
    const registration = await RegisterAnimal.findById(req.params.id)
    const registered = 'Registered'

    if(registration) {
        registration.registrationStatus = registered
        const updated = await registration.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Registration was not found.')
    }
})
// rejectRegistration

const sendRegisteredMessage = asyncHandler(async (req, res) => {
    const { email, name, animalName, } = req.body

    let mailOptions = {
        from: 'furryhope.mail@gmail.com',
        to: email,
        subject: 'Marikina Veterinary Office - Your pet has been registered to the vet office.',
        html: registerAnimalTemplate(name, animalName)
    }

    transport.sendMail(mailOptions, (error, result) => {
        if (error) {
            console.log(error)
        } else {
            console.log(`Success: ${result}`)
        }

        transport.close()
    })
})

const getAdoptionSubmissions = asyncHandler(async (req, res) => {
    const submissions = await Adoption.find()
    res.json(submissions)
})

const getAdoptionSubmissionPerAnimal = asyncHandler(async (req, res) => {
    const submissions = await Adoption.find({ animalId: req.params.id })
    
    if(submissions) {
        res.json(submissions)
    } else {
        res.status(404).json({ message: 'Could not find adoption applications'})
    }
})

const getAdoptionById = asyncHandler(async (req, res) => {
    const adoption = await Adoption.findById(req.params.id)

    if (adoption) {
        res.json(adoption)
    } else {
        res.status(404).json({ message: 'Could not find adoption application' })
    }
})

const getAdoptionByReference = asyncHandler(async (req, res) => {
    const { adoptionReference } = req.body
    const adoption = await Adoption.findOne({ adoptionReference: adoptionReference })

    if(adoption) {
        res.json(adoption)
    } else {
        res.status(404)
        throw new Error('Could not find adoption')
    }
})

const deleteAdoptionById = asyncHandler(async (req, res) => {
    const adoption = await Adoption.findById(req.params.id)

    if(adoption) {
        await adoption.remove()
        res.json({ message: 'Successfully removed'})
    }
})

const updateAdoptionStatus = asyncHandler(async (req, res) => {
    const { adoptionStatus } = req.body
    const animal = await Animal.findById(req.params.id)

    if (animal) {
        animal.adoptionStatus = adoptionStatus

        const updated = await animal.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error(`Animal's data was not found`)
    }
})

const updateAdmin = asyncHandler(async (req, res) => {
    const { fullName, email, contactNo, address, jobPosition, role, profilePicture } = req.body
    const admin = await Admin.findById(req.params.id)

    if(admin) {
        admin.fullName = fullName || admin.fullName
        admin.email = email || admin.email
        admin.contactNo = contactNo || admin.contactNo
        admin.address = address || admin.address
        admin.jobPosition = jobPosition || admin.jobPosition
        admin.role = role || admin.role
        admin.profilePicture = profilePicture || admin.profilePicture

        const updatedAdmin = await admin.save()

        res.json({
            _id: updatedAdmin._id,
            fullName: updatedAdmin.fullName,
            email: updatedAdmin.email,
            address: updatedAdmin.address,
            jobPosition: updatedAdmin.jobPosition,
            role: updatedAdmin.role,
            profilePicture: updatedAdmin.profilePicture
        })
    } else {
        res.status(404)
        throw new Error('Admin was not found')
    }
})

const updateRequirements = asyncHandler(async (req, res) => {
    const { regFeeComplete, certOfResidencyComplete, ownerPictureComplete, petPhotoComplete, proofOfAntiRabiesComplete, photocopyCertOfAntiRabiesComplete } = req.body
    const registration = await RegisterAnimal.findById(req.params.id)

    if(registration) {
        registration.regFeeComplete = regFeeComplete || registration.regFeeComplete
        registration.certOfResidencyComplete = certOfResidencyComplete || registration.certOfResidencyComplete
        registration.ownerPictureComplete = ownerPictureComplete || registration.ownerPictureComplete
        registration.petPhotoComplete = petPhotoComplete || registration.petPhotoComplete
        registration.proofOfAntiRabiesComplete = proofOfAntiRabiesComplete || registration.proofOfAntiRabiesComplete
        registration.photocopyCertOfAntiRabiesComplete = photocopyCertOfAntiRabiesComplete || registration.photocopyCertOfAntiRabiesComplete
    
        const updated = await registration.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Could not find registration. Invalid ID')
    }
})

const rejectRegistration = asyncHandler(async (req, res) => {
    const registration = await RegisterAnimal.findById(req.params.id)
    const registrationStatus = 'Not Registered'

    if(registration) {
        registration.registrationStatus = registrationStatus

        const updated = await registration.save()
        res.json(updated)
    }
})

const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { adoptionStatus, applicationStatus } = req.body

    const adoption = await Adoption.findById(req.params.id)

    if (adoption) {
        adoption.adoptionStatus = adoptionStatus
        adoption.applicationStatus = applicationStatus

        const updated = await adoption.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error(`Adoption application couldn't be found.`)
    }
})

const getUserAccounts = asyncHandler(async (req, res) => {
    const users = await User.find()
    res.json(users)
})

const getAdminAccounts = asyncHandler(async (req, res) => {
    const admins = await Admin.find()
    res.json(admins)
})

const deleteUserAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (user) {
        await user.remove()
        res.json({ message: 'User account has been removed'})
    }
})

const deleteAdminAccount = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id)

    if (admin) {
        await admin.remove()
        res.json({ message: 'Admin account has been removed'})
    }
})

const createInterviewSched = asyncHandler(async (req, res) => {
    const { recipientEmail, date, time } = req.body
    const applicant = req.params.id

    if(!recipientEmail || !date || !time) {
        res.status(400)
        throw new Error('Please fill out all the necessary fields.')
    } else if (!applicant) {
        res.status(400)
        throw new Error('There is no applicant ID')
    } else {
        const interviewSchedSubmission = await InterviewSched.create({
            recipientEmail, date, time, applicant
        })

        if(interviewSchedSubmission) {
            res.status(201).json({
                recipientEmail: interviewSchedSubmission.recipientEmail,
                date: interviewSchedSubmission.date,
                time: interviewSchedSubmission.time,
                applicant: interviewSchedSubmission.applicant
            })
        } else {
            res.status(400)
            throw new Error('An error has occured')
        }
    }

    let mailOptions = {
        from: 'furryhope.mail@gmail.com',
        to: recipientEmail,
        subject: 'Marikina Veterinary Office - Interview for Adopting one of our animals',
        html: sendInterviewSchedTemplate(date, time)
    }

    transport.sendMail(mailOptions, (error, result) => {
        if (error) {
            console.log(error)
        } else {
            console.log(`Success: ${result}`)
        }

        transport.close()
    })
})

const updateHasBeenInterviewed = asyncHandler(async (req, res) => {
    const adoption = await Adoption.findById(req.params.id)
    const hasBeenInterviewed = true

    if(adoption) {
        adoption.hasBeenInterviewed = hasBeenInterviewed
        const updated = adoption.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error(`An error has occurred, couldn't find adoption.`)
    }
})

const getInterviewSched = asyncHandler(async (req, res) => {
    const interviewSched = await InterviewSched.find({ applicant: req.params.id })

    if(!interviewSched) {
        res.status(404)
        throw new Error('Interview Schedule not found')
    } else {
        res.json(interviewSched)
    }
})

const submitPickupMessage = asyncHandler(async (req, res) => {
    const { email, pickupDate, pickupTime, animalName, adopterName } = req.body

    if(!email || !pickupDate || !pickupTime || !animalName || !adopterName) {
        res.status(400)
        throw new Error('Please fill out all the fields')
    } else {
        let mailOptions = {
            from: 'furryhope.mail@gmail.com',
            to: email,
            subject: 'Your adoption has been accepted - FurryHope',
            html: pickupTemplate(pickupDate, pickupTime, animalName, adopterName)
        }

        transport.sendMail(mailOptions, (error, result) => {
            if (error) {
                console.log(error)
            } else {
                console.log(`Success: ${result}`)
            }

            transport.close()
        })
    }
})

const sendRejectMessage = asyncHandler(async (req, res) => {
    const { email, adopterName, animalName } = req.body

    if(!adopterName || !animalName) {
        res.status(400)
        throw new Error('An error has occurred')
    } else {
        let mailOptions = {
            from: 'furryhope.mail@gmail.com',
            to: email,
            subject: 'Your adoption has been rejected - FurryHope',
            html: rejectAdoptionTemplate(adopterName, animalName)
        }

        transport.sendMail(mailOptions, (error, result) => {
            if (error) {
                console.log(error)
            } else {
                console.log(`Success: ${result}`)
            }

            transport.close()
        })
    }
})

const getDonations = asyncHandler(async (req, res) => {
    const donations = await Donation.find()
    res.json(donations)
})

const getDonationById = asyncHandler(async (req, res) => {
    const donation = await Donation.findById(req.params.id)
    if(donation) {
        res.json(donation)
    } else {
        res.status(404)
        throw new Error('Could not find specific adoption')
    }
})

const deleteDonation = asyncHandler(async (req, res) => {
    const donation = await Donation.findById(req.params.id)

    if(donation) {
        await donation.remove()
        res.json({ message: 'Removed donation.' })
    }
})

const receivedDonation = asyncHandler(async (req, res) => {
    const { proofOfDonation } = req.body
    const donation = await Donation.findById(req.params.id)
    const received = true

    if(donation) {
        donation.proofOfDonation = proofOfDonation
        donation.received = received
        const updated = await donation.save()
        res.json(updated)
    } else {
        res.status(404)
        throw new Error('Could not find donation')
    }
})

const addToInventory = asyncHandler(async (req, res) => {
    const { dataItems, donatedBy, email, contactNo, donatedByPicture, dateOfDonation, proofOfDonation, received, donationId } = req.body

    if(!dataItems || !donatedBy || !dateOfDonation)  {
        res.status(400)
        throw new Error('')
    } else {
        const addToInventorySubmission = await DonationInventory.create({
            dataItems, donatedBy, email, contactNo, donatedByPicture, dateOfDonation, proofOfDonation, received, donationId,
        })

        if(addToInventorySubmission) {
            res.status(201).json({
                dataItems: addToInventorySubmission.dataItems,
                donatedBy: addToInventorySubmission.donatedBy,
                email: addToInventorySubmission.email,
                contactNo: addToInventorySubmission.contactNo,
                donatedByPicture: addToInventorySubmission.donatedByPicture,
                dateOfDonation: addToInventorySubmission.dateOfDonation,
                proofOfDonation: addToInventorySubmission.proofOfDonation,
                received: addToInventorySubmission.received,
                donationId: addToInventorySubmission.donationId
            })
        } else {
            res.status(400)
            throw new Error('An error occurred, could not add to the inventory.')
        }
    }
})

const getDonationInventory = asyncHandler(async (req, res) => {
    const inventoryList = await DonationInventory.find()
    res.json(inventoryList)
})

const deleteFromInventory = asyncHandler(async (req, res) => {
    const inventory = await DonationInventory.findById(req.params.id)

    if(inventory) {
        await inventory.remove()
        res.json({ message: 'removed from donation inventory '})
    }
})

const sendResetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new Error('Please provide your email')
    }

    const admin = await Admin.findOne({ email })

    if(!admin) {
        throw new Error('Admin not found')
    }    

    // To check whether a token is still in the database.
    const token = await ResetPasswordToken.findOne({ owner: admin._id })
    if (token) {
        throw new Error('Your reset link is still valid, please wait for an hour upon requesting the link to get another one.')
    }

    // Generating the token for reseting the password
    const generatedToken = await generateResetPasswordToken()
    const resetToken = new ResetPasswordToken({ owner: admin._id, token: generatedToken })
    await resetToken.save()

    let mailOptions = {
        from: 'furryhope.mail@gmail.com',
        to: admin.email,
        subject: 'Reset Password Link - FurryHope',
        html: generateResetPasswordTemplate(`http://localhost:3001/reset-password?token=${generatedToken}&id=${admin._id}`)
    }

    transport.sendMail(mailOptions, (error, result) => {
        if (error) {
            console.log(error)
        } else {
            console.log(`Success: ${result}`)
        }

        transport.close()
    })

    res.json({
        success: true,
        message: 'Reset password link has been sent to your email.'
    })
})

const resetPassword = asyncHandler(async (req, res) => {
    // This 'user' and 'password' comes from the userAuth middleware where we check if the reset token is valid.
    const { password } = req.body

    const admin = await Admin.findById(req.admin._id)
    if (!admin) {
        throw new Error('User not found')
    }

    const isPasswordSame = await admin.matchPassword(password)
    if (isPasswordSame) {
        throw new Error('Please use a different password than your old one.')
    }

    if (password.trim().length < 8) {
        throw new Error('Password must be at least 8 characters.')
    }

    // Saving the new password in the database
    admin.password = password.trim()
    await admin.save()

    // Removing the token from the database.
    await ResetPasswordToken.findOneAndDelete({ owner: admin._id })

    let mailOptions = {
        from: 'furryhope.mail@gmail.com',
        to: admin.email,
        subject: 'Password Reset Successful - FurryHope',
        html: plainEmailTemplate(
            'Password has been changed',
            'Login in with your new password.'
        )
    }

    transport.sendMail(mailOptions, (error, result) => {
        if (error) {
            console.log(error)
        } else {
            console.log(`Success: ${result}`)
        }

        transport.close()
    })

    res.json({ 
        success: true,
        message: 'Password has been changed' 
    })
})

module.exports = {
    sendResetPassword,
    resetPassword,
    registerAdmin,
    authAdmin,
    disableAdmin,
    enableAdmin,
    getAdminInfo,
    getFeedbacks,
    getFeedback,
    deleteFeedback,
    updateFeedbackRead,
    updateRequirements,
    getPendingReports,
    getRegistration,
    getDismissedReports,
    getSpecificReport,
    reportHasBeenRead,
    dismissReport,
    deleteReport,
    getAllRegistrations,
    registerAnimal,
    sendRegisteredMessage,
    getAdoptionSubmissions,
    getAdoptionSubmissionPerAnimal,
    getAdoptionById,
    getAdoptionByReference,
    deleteAdoptionById,
    updateAdoptionStatus,
    updateApplicationStatus,
    getUserAccounts,
    getAdminAccounts,
    deleteUserAccount,
    deleteAdminAccount,
    createInterviewSched,
    getInterviewSched,
    submitPickupMessage,
    sendRejectMessage,
    getDonations,
    getDonationById,
    deleteDonation,
    receivedDonation,
    addToInventory,
    getDonationInventory,
    updateHasBeenInterviewed,
    updateAdmin,
    deleteFromInventory,
    getPendingRegistrations,
    getRegisteredPets,
    getNotRegisteredPets,
    deleteRegistration,
    rejectRegistration,
};