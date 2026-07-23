const { query } = require('../config/db');

/**
 * Helper to get JMO details based on user_id
 */
const getJmoDetails = async (userId) => {
    const result = await query(
        `SELECT jmo.jmo_id, jmo.hospital_id 
         FROM judicial_medical_officer jmo
         JOIN person p ON p.person_id = jmo.person_id
         WHERE p.user_id = $1 LIMIT 1`,
        [userId]
    );
    if (result.rowCount === 0) {
        throw new Error('JMO profile not found for this user.');
    }
    return result.rows[0];
};

/**
 * Get all completed laboratory results requested by the JMO
 */
const getLabResults = async (userId, search = '', filters = {}) => {
    const jmo = await getJmoDetails(userId);
    
    let sql = `
        SELECT lr.result_id, lr.completed_date, lt.test_name, 
               req.priority, pc.case_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               l.laboratory_name
        FROM laboratory_result lr
        JOIN laboratory_test lt ON lr.test_id = lt.test_id
        JOIN laboratory_request req ON lt.request_id = req.request_id
        JOIN laboratory l ON req.laboratory_id = l.laboratory_id
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        WHERE req.requested_by = $1
    `;
    
    const params = [jmo.jmo_id];
    let paramIndex = 2;

    if (search) {
        sql += ` AND (
            pc.case_number ILIKE $${paramIndex} OR 
            pat_p.first_name ILIKE $${paramIndex} OR 
            pat_p.last_name ILIKE $${paramIndex} OR
            lt.test_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    sql += ` ORDER BY lr.completed_date DESC`;

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Get single result details for JMO
 */
const getResultById = async (userId, resultId) => {
    const jmo = await getJmoDetails(userId);

    const result = await query(`
        SELECT lr.result_id, lr.findings, lr.interpretation, lr.completed_date, lr.report_file,
               lt.test_name, lt.remarks,
               req.request_id, req.priority,
               s.specimen_type, s.collection_datetime,
               pc.case_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               tech_p.first_name || ' ' || tech_p.last_name AS technician_name,
               l.laboratory_name
        FROM laboratory_result lr
        JOIN laboratory_test lt ON lr.test_id = lt.test_id
        JOIN laboratory_request req ON lt.request_id = req.request_id
        JOIN laboratory l ON req.laboratory_id = l.laboratory_id
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        JOIN laboratory_technician tech ON lt.technician_id = tech.technician_id
        JOIN person tech_p ON tech.person_id = tech_p.person_id
        WHERE lr.result_id = $1 AND req.requested_by = $2
    `, [resultId, jmo.jmo_id]);

    if (result.rowCount === 0) {
        throw new Error('Result not found or not authorized.');
    }

    const resultDetails = result.rows[0];

    // Fetch attached files using report_file (document_id)
    if (resultDetails.report_file) {
        const files = await query(`
            SELECT file_id, file_name, file_path, file_type, file_size 
            FROM uploaded_file 
            WHERE document_id = $1
        `, [resultDetails.report_file]);
        resultDetails.files = files.rows;
    } else {
        resultDetails.files = [];
    }

    return resultDetails;
};

/**
 * Get unread notifications for JMO
 */
const getNotifications = async (userId) => {
    const result = await query(`
        SELECT notification_id, message, notification_type, is_read, created_at
        FROM notifications
        WHERE user_id = $1 AND is_read = FALSE
        ORDER BY created_at DESC
    `, [userId]);
    
    return result.rows;
};

/**
 * Mark a notification as read
 */
const markNotificationRead = async (userId, notificationId) => {
    await query(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE notification_id = $1 AND user_id = $2
    `, [notificationId, userId]);
};

module.exports = {
    getLabResults,
    getResultById,
    getNotifications,
    markNotificationRead
};
