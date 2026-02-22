const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

exports.requestRide = async (req, res) => {
  const { pickup, drop, fare, distance, duration, vehicleType } = req.body;
  const passengerId = req.user.id;

  try {
    // Robustly extract coordinates
    let pickupCoords;
    if (pickup.location && pickup.location.coordinates) {
      pickupCoords = pickup.location.coordinates;
    } else if (pickup.longitude !== undefined && pickup.latitude !== undefined) {
      pickupCoords = [pickup.longitude, pickup.latitude];
    } else {
      return res.status(400).json({ msg: 'Invalid pickup location' });
    }

    let dropCoords;
    if (drop.location && drop.location.coordinates) {
      dropCoords = drop.location.coordinates;
    } else if (drop.longitude !== undefined && drop.latitude !== undefined) {
      dropCoords = [drop.longitude, drop.latitude];
    } else {
      return res.status(400).json({ msg: 'Invalid drop-off location' });
    }

    // Transform to GeoJSON for the model
    const pickupGeoJSON = {
      address: pickup.address,
      location: { type: 'Point', coordinates: pickupCoords }
    };

    const dropGeoJSON = {
      address: drop.address,
      location: { type: 'Point', coordinates: dropCoords }
    };

    // Find ALL nearby online drivers of correct vehicle type within 50km
    // Non-fatal: ride is created regardless of whether drivers are found
    let nearbyDrivers = [];
    try {
      nearbyDrivers = await Driver.find({
        isOnline: true,
        isApproved: true,
        vehicleType: vehicleType || 'car',
        currentLocation: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: pickupCoords
            },
            $maxDistance: 50000 // 50km
          }
        }
      });
    } catch (geoErr) {
      console.warn('Nearby driver geo-query skipped (may be index issue):', geoErr.message);
      // Fall back: notify all online+approved drivers with matching vehicleType
      nearbyDrivers = await Driver.find({ isOnline: true, isApproved: true, vehicleType: vehicleType || 'car' });
    }

    const ride = new Ride({
      passenger: passengerId,
      driver: null,
      pickup: pickupGeoJSON,
      drop: dropGeoJSON,
      fare,
      distance,
      duration,
      vehicleType: vehicleType || 'car',
      status: 'pending'
    });

    await ride.save();

    const populatedRide = await Ride.findById(ride._id).populate('passenger');

    // Notify all nearby drivers via their personal rooms
    nearbyDrivers.forEach(driver => {
      req.io.to(driver._id.toString()).emit('new_ride_request', populatedRide);
    });

    res.json(populatedRide);
  } catch (err) {
    console.error('Ride Request Error:', err);
    res.status(500).send('Server error');
  }
};

exports.acceptRide = async (req, res) => {
  const { rideId } = req.params;
  const driverId = req.user.id; // Assuming auth middleware provides the driver's ID

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ msg: 'Ride not found' });
    }

    // FIX: Schema uses 'pending', not 'requested'
    if (ride.status !== 'pending') {
      return res.status(400).json({ msg: 'Ride is no longer available' });
    }

    // Prevent duplicate acceptance (race condition safety)
    if (ride.driver && ride.driver.toString() !== driverId) {
      return res.status(400).json({ msg: 'Ride already accepted by another driver' });
    }

    ride.driver = driverId;
    ride.status = 'accepted';
    ride.acceptedAt = Date.now();
    await ride.save();

    const updatedRide = await Ride.findById(rideId)
      .populate('passenger')
      .populate('driver');

    const passengerId = updatedRide.passenger._id.toString();

    // CRITICAL FIX: Make ALL driver sockets join the ride room
    // This ensures location updates are properly broadcast
    const driverSockets = await req.io.in(driverId).fetchSockets();
    driverSockets.forEach(socket => {
      socket.join(rideId);
      console.log(`Driver socket ${socket.id} joined ride room ${rideId}`);
    });

    // Emit to passenger's personal room (join_user)
    req.io.to(passengerId).emit('ride_accepted', updatedRide);
    // Emit to ride room (passenger joins ride room on requestRide)
    req.io.to(rideId).emit('ride_accepted', updatedRide);
    req.io.to(rideId).emit('ride_status_update', updatedRide);
    // Emit to driver (confirmation)
    req.io.to(driverId).emit('ride_accepted', updatedRide);

    console.log(`Ride ${rideId} accepted by driver ${driverId}, notified passenger ${passengerId}`);

    res.json(updatedRide);
  } catch (err) {
    console.error('Accept Ride Error:', err);
    res.status(500).send('Server error');
  }
};

exports.rejectRide = async (req, res) => {
  const { rideId } = req.params;
  const driverId = req.user.id;

  try {
    // For now, we just acknowledge the rejection. 
    // In a production app, we'd mark this driver as having rejected this specific ride.
    res.json({ msg: 'Ride rejected' });
  } catch (err) {
    console.error('Reject Ride Error:', err);
    res.status(500).send('Server error');
  }
};

exports.updateRideStatus = async (req, res) => {
  const { status } = req.body;
  const { rideId } = req.params;

  try {
    let ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    ride.status = status;
    if (status === 'completed') {
      ride.completedAt = Date.now();
    }
    await ride.save();

    const updatedRide = await Ride.findById(rideId).populate('passenger').populate('driver');

    // Emit to ride room
    req.io.to(rideId).emit('ride_status_update', updatedRide);

    // Also emit to passenger and driver personal rooms (Vercel serverless resilience)
    if (updatedRide.passenger) {
      req.io.to(updatedRide.passenger._id.toString()).emit('ride_status_update', updatedRide);
    }
    if (updatedRide.driver) {
      req.io.to(updatedRide.driver._id.toString()).emit('ride_status_update', updatedRide);
    }

    res.json(updatedRide);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getActiveRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      $or: [
        { passenger: req.user.id },
        { driver: req.user.id }
      ],
      status: { $in: ['pending', 'accepted', 'arrived', 'started'] }
    }).populate('passenger').populate('driver');

    if (!ride) {
      return res.status(200).json(null);
    }
    res.json(ride);
  } catch (err) {
    console.error('Get Active Ride Error:', err);
    res.status(500).send('Server error');
  }
};

exports.getNearbyRequests = async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ msg: 'Coordinates are required' });
  }

  try {
    const coords = [parseFloat(longitude), parseFloat(latitude)];

    // Find all 'requested' rides within 40km of the driver's current position
    const rides = await Ride.find({
      status: 'pending',
      'pickup.location': {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: coords
          },
          $maxDistance: 50000 // 50km
        }
      }
    }).populate('passenger');

    res.json(rides);
  } catch (err) {
    console.error('Get Nearby Requests Error:', err);
    res.status(500).send('Server error');
  }
};
