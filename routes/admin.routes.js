const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/stats', protect, authorize('admin'), adminController.getSystemStats);
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);
router.get('/drivers', protect, authorize('admin'), adminController.getAllDrivers);
router.get('/pending-drivers', protect, authorize('admin'), adminController.getPendingDrivers);
router.put('/approve-driver/:id', protect, authorize('admin'), adminController.approveDriver);
router.put('/users/:id/block', protect, authorize('admin'), adminController.toggleUserBlock);
router.put('/drivers/:id/approve', protect, authorize('admin'), adminController.toggleDriverApproval);
router.delete('/reject-driver/:id', protect, authorize('admin'), adminController.rejectDriver);
router.delete('/drivers/:id', protect, authorize('admin'), adminController.deleteDriver);
router.delete('/users/:id', protect, authorize('admin'), adminController.deleteUser);
router.get('/rides', protect, authorize('admin'), adminController.getAllRides);
router.delete('/rides/:id', protect, authorize('admin'), adminController.deleteRide);

router.get('/settings', protect, settingsController.getSettings);
router.post('/settings', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;
