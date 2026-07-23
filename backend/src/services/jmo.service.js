const { query, withTransaction } = require('../config/db');

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
 * Get all available laboratories from PostgreSQL
 */
const getLaboratories = async () => {
    const result = await query(`
        SELECT l.laboratory_id, l.laboratory_name, l.laboratory_type, 
               h.hospital_name, l.contact_number, l.email
        FROM laboratory l
        LEFT JOIN hospital h ON l.hospital_id = h.hospital_id
        ORDER BY l.laboratory_name ASC
    `);
    return result.rows;
};

/**
 * Get specimens for the logged-in JMO to select in the request form
 */
const getJmoSpecimens = async (userId) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (err) {
        console.warn('JMO profile not resolved for user_id:', userId);
    }

    let result;
    if (jmoId) {
        result = await query(`
            SELECT s.specimen_id, s.specimen_type, s.collection_datetime, s.remarks,
                   e.examination_id,
                   pc.case_number, pc.case_type,
                   pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
                   pat.patient_id
            FROM specimen s
            JOIN examination e ON s.examination_id = e.examination_id
            JOIN mlef m ON e.mlef_id = m.mlef_id
            JOIN police_case pc ON m.case_id = pc.case_id
            JOIN patient pat ON m.patient_id = pat.patient_id
            JOIN person pat_p ON pat.person_id = pat_p.person_id
            WHERE e.jmo_id = $1 OR s.collected_by = $1
            ORDER BY s.collection_datetime DESC
        `, [jmoId]);
    }

    // Fallback: Load all collected specimens in database if none linked specifically to this JMO
    if (!result || result.rowCount === 0) {
        result = await query(`
            SELECT s.specimen_id, s.specimen_type, s.collection_datetime, s.remarks,
                   e.examination_id,
                   pc.case_number, pc.case_type,
                   pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
                   pat.patient_id
            FROM specimen s
            JOIN examination e ON s.examination_id = e.examination_id
            JOIN mlef m ON e.mlef_id = m.mlef_id
            JOIN police_case pc ON m.case_id = pc.case_id
            JOIN patient pat ON m.patient_id = pat.patient_id
            JOIN person pat_p ON pat.person_id = pat_p.person_id
            ORDER BY s.collection_datetime DESC
        `);
    }

    return result.rows;
};

/**
 * Create a new laboratory request from JMO
 */
const createLabRequest = async (userId, { specimenId, laboratoryId, testName, priority = 'NORMAL', clinicalNotes }) => {
    const jmo = await getJmoDetails(userId);

    return withTransaction(async (client) => {
        const reqResult = await client.query(`
            INSERT INTO laboratory_request (specimen_id, laboratory_id, requested_by, priority, status)
            VALUES ($1, $2, $3, $4, 'PENDING')
            RETURNING request_id, specimen_id, laboratory_id, requested_by, request_date, priority, status
        `, [specimenId, laboratoryId, jmo.jmo_id, priority]);

        const newRequest = reqResult.rows[0];

        if (testName) {
            await client.query(`
                INSERT INTO laboratory_test (request_id, test_name, status, remarks)
                VALUES ($1, $2, 'PENDING', $3)
            `, [newRequest.request_id, testName, clinicalNotes || null]);
        }

        await client.query(`
            INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
            VALUES ($1, 'CREATE_LAB_REQUEST', 'laboratory_request', $2, 'JMO created laboratory request')
        `, [userId, newRequest.request_id]);

        return newRequest;
    });
};

/**
 * Get all requests submitted by the logged-in JMO
 */
const getJmoRequests = async (userId, search = '', filters = {}) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (e) {}

    let sql = `
        SELECT req.request_id, req.priority, req.status, req.request_date,
               s.specimen_type,
               l.laboratory_name,
               pc.case_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               lt.test_name, lt.completed_at
        FROM laboratory_request req
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN laboratory l ON req.laboratory_id = l.laboratory_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        LEFT JOIN laboratory_test lt ON req.request_id = lt.request_id
        WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (jmoId) {
        sql += ` AND req.requested_by = $${paramIndex}`;
        params.push(jmoId);
        paramIndex++;
    }

    if (filters.status) {
        sql += ` AND req.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
    }

    if (filters.priority) {
        sql += ` AND req.priority = $${paramIndex}`;
        params.push(filters.priority);
        paramIndex++;
    }

    if (search) {
        sql += ` AND (
            pc.case_number ILIKE $${paramIndex} OR 
            pat_p.first_name ILIKE $${paramIndex} OR 
            pat_p.last_name ILIKE $${paramIndex} OR
            l.laboratory_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    sql += ` ORDER BY req.request_date DESC`;

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Cancel a pending laboratory request (only if still PENDING)
 */
const cancelLabRequest = async (userId, requestId) => {
    const jmo = await getJmoDetails(userId);

    const result = await query(`
        UPDATE laboratory_request
        SET status = 'CANCELLED'
        WHERE request_id = $1 AND requested_by = $2 AND status = 'PENDING'
        RETURNING request_id, status
    `, [requestId, jmo.jmo_id]);

    if (result.rowCount === 0) {
        throw new Error('Request cannot be cancelled. Either it does not exist or has already been accepted/processed.');
    }

    return result.rows[0];
};

/**
 * Get all completed laboratory results requested by the JMO
 */
const getLabResults = async (userId, search = '', filters = {}) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (e) {}
    
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
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (jmoId) {
        sql += ` AND req.requested_by = $${paramIndex}`;
        params.push(jmoId);
        paramIndex++;
    }

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
        LEFT JOIN laboratory_technician tech ON lt.technician_id = tech.technician_id
        LEFT JOIN person tech_p ON tech.person_id = tech_p.person_id
        WHERE lr.result_id = $1
    `, [resultId]);

    if (result.rowCount === 0) {
        throw new Error('Result not found.');
    }

    const resultDetails = result.rows[0];

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
    getLaboratories,
    getJmoSpecimens,
    createLabRequest,
    getJmoRequests,
    cancelLabRequest,
    getLabResults,
    getResultById,
    getNotifications,
    markNotificationRead
};
