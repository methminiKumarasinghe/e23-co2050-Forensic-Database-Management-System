const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const adminDashboardRoutes = require('./routes/admin/dashboard.routes');
const adminUsersRoutes = require('./routes/admin/users.routes');
const adminRolesRoutes = require('./routes/admin/roles.routes');
const adminHospitalsRoutes = require('./routes/admin/hospitals.routes');
const adminDepartmentsRoutes = require('./routes/admin/departments.routes');
const adminAuditLogsRoutes = require('./routes/admin/auditlogs.routes');
const adminNotificationsRoutes = require('./routes/admin/notifications.routes');
const policeRoutes = require('./routes/police.routes');
const jmoRoutes = require('./routes/jmo.routes');
const laboratoryRoutes = require('./routes/laboratory.routes');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/admin/dashboard', adminDashboardRoutes);
app.use('/admin/users', adminUsersRoutes);
app.use('/admin/roles', adminRolesRoutes);
app.use('/admin/hospitals', adminHospitalsRoutes);
app.use('/admin/departments', adminDepartmentsRoutes);
app.use('/admin/auditlogs', adminAuditLogsRoutes);
app.use('/admin/notifications', adminNotificationsRoutes);

app.use('/police', policeRoutes);
app.use('/jmo', jmoRoutes);
app.use('/laboratory', laboratoryRoutes);

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
