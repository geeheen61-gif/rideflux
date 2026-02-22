const Ride = require('../models/Ride');

// @desc    Get user ride history
// @route   GET /api/users/rides
exports.getUserRides = async (req, res) => {
    try {
        const rides = await Ride.find({ passenger: req.user.id })
            .populate('driver', 'name vehicleType vehicleNumber')
            .sort('-createdAt');
        res.json(rides);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user stats
// @route   GET /api/users/stats
exports.getUserStats = async (req, res) => {
    try {
        const totalRides = await Ride.countDocuments({ passenger: req.user.id });
        const completedRides = await Ride.countDocuments({ passenger: req.user.id, status: 'completed' });
        const totalSpent = await Ride.aggregate([
            { $match: { passenger: req.user.id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$fare' } } }
        ]);

        res.json({
            totalRides,
            completedRides,
            totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
