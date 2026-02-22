const express = require('express');
const router = express.Router();
const rideController = require('../controllers/ride.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/request', auth.protect, rideController.requestRide);
router.get('/active', auth.protect, rideController.getActiveRide);
router.get('/nearby', auth.protect, rideController.getNearbyRequests);
router.put('/:rideId/accept', auth.protect, rideController.acceptRide);
router.put('/:rideId/reject', auth.protect, rideController.rejectRide);
router.put('/:rideId/status', auth.protect, rideController.updateRideStatus);

module.exports = router;
