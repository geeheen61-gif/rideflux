const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Update system settings
// @route   POST /api/admin/settings
exports.updateSettings = async (req, res) => {
    const { carBaseFare, bikeBaseFare, surgeMultiplier } = req.body;
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }
        if (carBaseFare) settings.carBaseFare = carBaseFare;
        if (bikeBaseFare) settings.bikeBaseFare = bikeBaseFare;
        if (surgeMultiplier) settings.surgeMultiplier = surgeMultiplier;
        settings.updatedAt = Date.now();

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
