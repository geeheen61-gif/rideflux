const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

exports.updateStatus = async (req, res) => {
  const { isOnline, location } = req.body;
  const driverId = req.user.id;

  try {
    let driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ msg: 'Driver not found' });

    if (isOnline !== undefined) driver.isOnline = isOnline;
    if (location) {
      // Accept both GeoJSON {type, coordinates:[lng,lat]} and flat {longitude, latitude}
      let coords;
      if (location.coordinates && Array.isArray(location.coordinates)) {
        coords = location.coordinates; // [lng, lat]
      } else if (location.longitude !== undefined && location.latitude !== undefined) {
        coords = [location.longitude, location.latitude];
      }
      if (coords) {
        driver.currentLocation = { type: 'Point', coordinates: coords };
      }
    }

    await driver.save();
    res.json(driver);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getOnlineDrivers = async (req, res) => {
  const { lat, lng, radius } = req.query;
  try {
    let query = { isOnline: true, isApproved: true };

    if (lat && lng) {
      query.currentLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius ? parseInt(radius) : 40000 // Increased to 40km for better discovery
        }
      };
    }

    const drivers = await Driver.find(query).select('currentLocation vehicleType name');
    res.json(drivers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get driver stats
// @route   GET /api/drivers/stats
exports.getDriverStats = async (req, res) => {
  try {
    const totalTrips = await Ride.countDocuments({ driver: req.user.id, status: 'completed' });
    const earnings = await Ride.aggregate([
      { $match: { driver: req.user.id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } }
    ]);

    res.json({
      totalTrips,
      rating: 4.9, // Mock rating for now as we don't have review system yet
      totalEarnings: earnings.length > 0 ? earnings[0].total : 0
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// @desc    Get driver trips
// @route   GET /api/drivers/trips
exports.getDriverTrips = async (req, res) => {
  try {
    const trips = await Ride.find({ driver: req.user.id })
      .populate('passenger', 'name')
      .sort('-createdAt');
    res.json(trips);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

