const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware')
const { isResetTokenValid } = require('../middlewares/userAuth')
const { 
    registerUser, 
    verifyUser,
    sendResetPassword,
    resetPassword,
    loginUser,
    getUserById, 
    updateUserProfile,
    updateProfilePicture,
    updatePassword,
    submitFeedback, 
    submitReport,
    getSpecificRegistrations,
    submitAnimalRegistration,
    submitAdoption,
    getAnimalRegistrationById,
    deleteAnimalRegistration,
    getSpecificAdoptions,
    updatePreference,
    submitDonation,
    reSendCode,
    reVerifyUser,
    getReportsPerUser,
    updateLimitation,
    removeRegFromAdoption,
    cancelAdoption,
    cancelUpdateAdoption,
    cancelUpdateAnimal,
    cancelUpdateUser,
    getMostRecentAdoption,
} = require('../controllers/userController');
const { update } = require('../models/userModel');

// http://localhost:5000/api/users/

// route for registering the user (/api/users)
router.route('/').post(registerUser)

router.route('/verifyUser/:id').post(verifyUser)

router.route('/resendCode').post(reSendCode)

router.route('/reVerifyUser').post(reVerifyUser)

// Route to send the reset password link to the user
router.route('/sendResetPassword').post(sendResetPassword)

// Route to change / reset the password
router.route('/resetPassword').post(isResetTokenValid, resetPassword)

router.route('/verify-token').get(isResetTokenValid, (req, res) => {
    res.json({ success: true })
})

// Route for logging the user into the application (/api/users/loginUser)
router.route('/loginUser').post(loginUser)

router.route('/getUserById/:id').get(getUserById)

router.route('/updateUserProfile/:id').put(updateUserProfile)

router.route('/updateProfilePicture/:id').put(updateProfilePicture)

router.route('/updatePassword/:id').put(updatePassword)

router.route('/updateLimitation/:id').put(updateLimitation)

router.route('/submitFeedback').post(submitFeedback)

router.route('/report').post(authenticate, submitReport)

router.route('/getReportsPerUser').get(authenticate, getReportsPerUser)


// Routes for adoptions
router.route('/submitAdoption').post(authenticate, submitAdoption)
router.route('/getSpecificAdoptions').get(authenticate, getSpecificAdoptions)
router.route('/getMostRecentAdoption').get(authenticate, getMostRecentAdoption)

router.route('/cancelUpdateAdoption/:id').put(cancelUpdateAdoption)
router.route('/cancelUpdateAnimal/:id').put(cancelUpdateAnimal)
router.route('/cancelUpdateUser/:id').put(cancelUpdateUser)
router.route('/cancelAdoption').post(cancelAdoption)


// Routes for registering and getting all registration submissions
router.route('/registerAnimal').post(authenticate, submitAnimalRegistration)

// Routes for the donation
router.route('/submitDonation').post(authenticate, submitDonation)

// getting a specific registration from a specific user's submission - using their token
router.route('/getSpecificRegistrations').get(authenticate, getSpecificRegistrations)

router.route('/removeRegFromAdoption').put(removeRegFromAdoption)

router.route('/updatePreference/:id').put(updatePreference)


router.route('/animalRegistration/:id')
.put()
.get(getAnimalRegistrationById)
.delete(deleteAnimalRegistration)


module.exports = router;
