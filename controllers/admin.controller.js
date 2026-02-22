const User = require('../models/User');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

// @desc    Get system-wide stats
// @route   GET /api/admin/stats
exports.getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalDrivers = await Driver.countDocuments({ role: 'driver' });
        const activeRides = await Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'arrived', 'started'] } });

        const totalCompletedRides = await Ride.countDocuments({ status: 'completed' });
        const revenue = await Ride.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$fare' } } }
        ]);

        res.json({
            totalUsers,
            totalDrivers,
            activeRides,
            totalCompletedRides,
            totalRevenue: revenue.length > 0 ? revenue[0].total : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Get all drivers
// @route   GET /api/admin/drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({ role: 'driver' }).select('-password').lean();

        // Add trip count for each driver
        const driversWithStats = await Promise.all(drivers.map(async (driver) => {
            const totalTrips = await Ride.countDocuments({ driver: driver._id, status: 'completed' });
            return { ...driver, totalTrips };
        }));

        res.json({ success: true, data: driversWithStats });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Get pending driver approvals
// @route   GET /api/admin/pending-drivers
exports.getPendingDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({ isApproved: false, role: 'driver' }).select('-password');
        res.json(drivers);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Approve a driver
// @route   PUT /api/admin/approve-driver/:id
exports.approveDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });

        driver.isApproved = true;
        await driver.save();
        res.json({ msg: 'Driver approved successfully', driver });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Reject/Delete a driver application
// @route   DELETE /api/admin/reject-driver/:id
exports.rejectDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });
        res.json({ msg: 'Driver application rejected and removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get all rides
// @route   GET /api/admin/rides
exports.getAllRides = async (req, res) => {
    try {
        const rides = await Ride.find()
            .populate('passenger', 'name email')
            .populate('driver', 'name vehicleType')
            .sort('-createdAt');
        res.json({ success: true, data: rides });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a driver
// @route   DELETE /api/admin/drivers/:id
exports.deleteDriver = async (req, res) => {
    try {
        await Driver.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Driver deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a ride
// @route   DELETE /api/admin/rides/:id
exports.deleteRide = async (req, res) => {
    try {
        await Ride.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Ride deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle user block status
// @route   PUT /api/admin/users/:id/block
exports.toggleUserBlock = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.isBlocked = req.body.isBlocked;
        await user.save();

        res.json({ success: true, msg: user.isBlocked ? 'User blocked' : 'User unblocked', data: user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle driver approval status
// @route   PUT /api/admin/drivers/:id/approve
exports.toggleDriverApproval = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ msg: 'Driver not found' });
        }

        driver.isApproved = req.body.isApproved;
        await driver.save();

        res.json({ success: true, msg: driver.isApproved ? 'Driver approved' : 'Driver unapproved', data: driver });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
