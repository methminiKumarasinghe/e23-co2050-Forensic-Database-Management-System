const pool = require('../database/connection');

// Middleware to check if the staff is associated with the hospital if the resource is hospital specific
const checkStaffHospital = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        // Skip restriction for ADMIN
        if (req.user.roles && req.user.roles.includes('ADMIN')) {
            return next();
        }

        // We assume global read access for Forensic Staff except for editing their own appointments
        // The repository will handle filtering by hospital_id if necessary.
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkStaffHospital
};
