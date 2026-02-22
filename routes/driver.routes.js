const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const auth = require('../middlewares/auth.middleware');

router.put('/status', auth.protect, driverController.updateStatus);
router.get('/online', auth.protect, driverController.getOnlineDrivers);
router.get('/stats', auth.protect, driverController.getDriverStats);
router.get('/trips', auth.protect, driverController.getDriverTrips);

module.exports = router;
