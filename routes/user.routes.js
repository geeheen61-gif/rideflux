const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/rides', protect, userController.getUserRides);
router.get('/stats', protect, userController.getUserStats);

module.exports = router;
