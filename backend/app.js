const express = require('express');
const cors = require('cors');
require('dotenv').config();
const verifyAndSeed = require('./database/db_verify_seed');


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
const adminPoliceStationsRoutes = require('./routes/admin/policestations.routes');
const adminLaboratoriesRoutes = require('./routes/admin/laboratories.routes');
const adminStaffRoutes = require('./routes/admin/staff.routes');
const adminCasesRoutes = require('./routes/admin/cases.routes');
const adminDocumentsRoutes = require('./routes/admin/documents.routes');
const adminAccessLogsRoutes = require('./routes/admin/accesslogs.routes');
const adminReportsRoutes = require('./routes/admin/reports.routes');
const adminSettingsRoutes = require('./routes/admin/settings.routes');
const policeRoutes = require('./routes/police.routes');
const jmoRoutes = require('./routes/jmo.routes');
const laboratoryRoutes = require('./routes/laboratory.routes');
const staffRoutes = require('./routes/staff.routes');

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
app.use('/admin/policestations', adminPoliceStationsRoutes);
app.use('/admin/laboratories', adminLaboratoriesRoutes);
app.use('/admin/staff', adminStaffRoutes);
app.use('/admin/cases', adminCasesRoutes);
app.use('/admin/documents', adminDocumentsRoutes);
app.use('/admin/accesslogs', adminAccessLogsRoutes);
app.use('/admin/reports', adminReportsRoutes);
app.use('/admin/settings', adminSettingsRoutes);

app.use('/police', policeRoutes);
app.use('/jmo', jmoRoutes);
app.use('/laboratory', laboratoryRoutes);
app.use('/staff', staffRoutes);

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await verifyAndSeed();
  });
}

module.exports = app;
