const { query, withTransaction } = require('../config/db');

/**
 * Helper to get technician details based on user_id
 */
const getTechnicianDetails = async (userId) => {
    const result = await query(
        `SELECT lt.technician_id, lt.hospital_id, l.laboratory_id 
         FROM laboratory_technician lt
         JOIN person p ON p.person_id = lt.person_id
         LEFT JOIN laboratory l ON l.hospital_id = lt.hospital_id
         WHERE p.user_id = $1 LIMIT 1`,
        [userId]
    );
    if (result.rowCount === 0) {
        throw new Error('Laboratory technician profile not found for this user.');
    }
    return result.rows[0];
};

/**
 * Get dashboard statistics for the laboratory
 */
const getDashboardStats = async (userId) => {
    const tech = await getTechnicianDetails(userId);
    const labId = tech.laboratory_id;
    
    if (!labId) {
        return { pending: 0, accepted: 0, processing: 0, completed: 0, todayRequests: 0, recentResults: [] };
    }

    const countsQuery = await query(`
        SELECT status, COUNT(*) as count 
        FROM laboratory_request 
        WHERE laboratory_id = $1 
        GROUP BY status
    `, [labId]);

    const stats = {
        pending: 0,
        accepted: 0,
        processing: 0,
        completed: 0,
    };

    countsQuery.rows.forEach(row => {
        if (row.status === 'PENDING') stats.pending = parseInt(row.count);
        if (row.status === 'ACCEPTED') stats.accepted = parseInt(row.count);
        if (row.status === 'PROCESSING') stats.processing = parseInt(row.count);
        if (row.status === 'COMPLETED') stats.completed = parseInt(row.count);
    });

    const todayQuery = await query(`
        SELECT COUNT(*) as count 
        FROM laboratory_request 
        WHERE laboratory_id = $1 
        AND DATE(request_date) = CURRENT_DATE
    `, [labId]);

    const todayRequests = parseInt(todayQuery.rows[0].count);

    const recentResultsQuery = await query(`
        SELECT lr.result_id, lr.completed_date, lt.test_name, req.priority, p.case_number
        FROM laboratory_result lr
        JOIN laboratory_test lt ON lr.test_id = lt.test_id
        JOIN laboratory_request req ON lt.request_id = req.request_id
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case p ON m.case_id = p.case_id
        WHERE req.laboratory_id = $1
        ORDER BY lr.completed_date DESC
        LIMIT 5
    `, [labId]);

    return {
        ...stats,
        todayRequests,
        recentResults: recentResultsQuery.rows
    };
};

/**
 * Get assigned laboratory requests with search and filters
 */
const getRequests = async (userId, filters = {}, search = '') => {
    const tech = await getTechnicianDetails(userId);
    const labId = tech.laboratory_id;
    if (!labId) return [];

    let sql = `
        SELECT req.request_id, req.priority, req.status, req.request_date,
               s.specimen_type, 
               pc.case_number,
               jmo_p.first_name || ' ' || jmo_p.last_name AS jmo_name,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name
        FROM laboratory_request req
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        JOIN judicial_medical_officer jmo ON req.requested_by = jmo.jmo_id
        JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
        WHERE req.laboratory_id = $1
    `;
    const params = [labId];
    let paramIndex = 2;

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
            pat_p.last_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    sql += ` ORDER BY req.request_date DESC`;

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Get request details
 */
const getRequestById = async (userId, requestId) => {
    const tech = await getTechnicianDetails(userId);
    const labId = tech.laboratory_id;

    const result = await query(`
        SELECT req.request_id, req.priority, req.status, req.request_date,
               s.specimen_type, s.remarks AS specimen_remarks, s.collection_datetime,
               pc.case_number, pc.case_type, pc.description AS case_description,
               m.reason AS mlef_reason,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               pat.blood_group,
               jmo_p.first_name || ' ' || jmo_p.last_name AS jmo_name,
               e.examination_notes
        FROM laboratory_request req
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        JOIN judicial_medical_officer jmo ON req.requested_by = jmo.jmo_id
        JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
        WHERE req.request_id = $1 AND req.laboratory_id = $2
    `, [requestId, labId]);

    if (result.rowCount === 0) {
        throw new Error('Laboratory request not found or not assigned to your laboratory.');
    }

    const requestDetails = result.rows[0];

    // Fetch tests if any
    const tests = await query(`
        SELECT test_id, test_name, started_at, completed_at, status, remarks 
        FROM laboratory_test 
        WHERE request_id = $1
    `, [requestId]);

    requestDetails.tests = tests.rows;

    return requestDetails;
};

/**
 * Update request status
 */
const updateRequestStatus = async (userId, requestId, status) => {
    const tech = await getTechnicianDetails(userId);
    const labId = tech.laboratory_id;

    const validStatuses = ['PENDING', 'ACCEPTED', 'PROCESSING', 'COMPLETED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new Error('Invalid status.');
    }

    const result = await query(
        `UPDATE laboratory_request 
         SET status = $1 
         WHERE request_id = $2 AND laboratory_id = $3 
         RETURNING request_id, status`,
        [status, requestId, labId]
    );

    if (result.rowCount === 0) {
        throw new Error('Request not found or unauthorized.');
    }
    return result.rows[0];
};

/**
 * Start a test (sets status to PROCESSING and creates laboratory_test)
 */
const startTest = async (userId, requestId, testName) => {
    const tech = await getTechnicianDetails(userId);
    
    return withTransaction(async (client) => {
        // Update request status
        await client.query(
            `UPDATE laboratory_request SET status = 'PROCESSING' WHERE request_id = $1 AND laboratory_id = $2`,
            [requestId, tech.laboratory_id]
        );

        // Insert laboratory_test
        const testResult = await client.query(
            `INSERT INTO laboratory_test (request_id, technician_id, test_name, started_at, status) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'PENDING') 
             RETURNING test_id`,
            [requestId, tech.technician_id, testName]
        );

        return testResult.rows[0];
    });
};

/**
 * Submit result (Completes test, creates result, handles files, sets request to COMPLETED)
 */
const submitResult = async (userId, resultData, files) => {
    const { requestId, testName, findings, interpretation, comments } = resultData;
    const tech = await getTechnicianDetails(userId);

    return withTransaction(async (client) => {
        // Find existing test or create one if it doesn't exist
        let testResult = await client.query(
            `SELECT test_id FROM laboratory_test WHERE request_id = $1 AND test_name = $2 LIMIT 1`,
            [requestId, testName]
        );
        let testId;
        
        if (testResult.rowCount === 0) {
             const newTest = await client.query(
                `INSERT INTO laboratory_test (request_id, technician_id, test_name, started_at, completed_at, status, remarks) 
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'COMPLETED', $4) 
                 RETURNING test_id`,
                [requestId, tech.technician_id, testName, comments]
            );
            testId = newTest.rows[0].test_id;
        } else {
            testId = testResult.rows[0].test_id;
            await client.query(
                `UPDATE laboratory_test SET completed_at = CURRENT_TIMESTAMP, status = 'COMPLETED', remarks = $1 WHERE test_id = $2`,
                [comments, testId]
            );
        }

        // Insert result
        const labResult = await client.query(
            `INSERT INTO laboratory_result (test_id, findings, interpretation, completed_date) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
             RETURNING result_id`,
            [testId, findings, interpretation]
        );
        const resultId = labResult.rows[0].result_id;

        // Note: For document tracking, the forensic_database schema specifies `document_id` in `uploaded_file`. 
        // We need a dummy document if we are storing just the file. Or we create a document record.
        // Let's create a document record for this result
        let documentId = null;
        if (files && files.length > 0) {
             const docResult = await client.query(
                 `INSERT INTO document (document_number, document_type, title, created_by, status)
                  VALUES ($1, $2, $3, $4, 'APPROVED') RETURNING document_id`,
                 ['LAB-RES-' + Date.now(), 'LABORATORY_RESULT', 'Lab Result for Test: ' + testName, userId]
             );
             documentId = docResult.rows[0].document_id;
             
             for (const file of files) {
                 await client.query(
                     `INSERT INTO uploaded_file (document_id, file_name, file_path, file_type, file_size, uploaded_by)
                      VALUES ($1, $2, $3, $4, $5, $6)`,
                     [documentId, file.originalname, file.path, file.mimetype, file.size, userId]
                 );
             }

             // Link document to result using report_file field storing document_id 
             // (Since report_file is TEXT, we can store the document_id as string or keep it blank and rely on relations)
             await client.query(
                 `UPDATE laboratory_result SET report_file = $1 WHERE result_id = $2`,
                 [documentId, resultId]
             );
        }

        // Update request status
        await client.query(
            `UPDATE laboratory_request SET status = 'COMPLETED' WHERE request_id = $1`,
            [requestId]
        );

        // Fetch requested_by (JMO) and case_number to send notification
        const reqInfo = await client.query(
            `SELECT r.requested_by, pc.case_number, u.user_id as jmo_user_id
             FROM laboratory_request r
             JOIN judicial_medical_officer jmo ON r.requested_by = jmo.jmo_id
             JOIN person p ON jmo.person_id = p.person_id
             JOIN users u ON p.user_id = u.user_id
             JOIN specimen s ON r.specimen_id = s.specimen_id
             JOIN examination e ON s.examination_id = e.examination_id
             JOIN mlef m ON e.mlef_id = m.mlef_id
             JOIN police_case pc ON m.case_id = pc.case_id
             WHERE r.request_id = $1`,
            [requestId]
        );

        if (reqInfo.rowCount > 0) {
            const { jmo_user_id, case_number } = reqInfo.rows[0];
            const message = `Laboratory results for Case ${case_number} are now available.`;
            await client.query(
                `INSERT INTO notifications (user_id, message, notification_type) 
                 VALUES ($1, $2, 'LAB_RESULT')`,
                [jmo_user_id, message]
            );
        }

        // Audit log
        await client.query(
            `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
             VALUES ($1, 'SUBMIT_RESULT', 'laboratory_result', $2, 'Submitted laboratory result')`,
            [userId, resultId]
        );

        return { result_id: resultId };
    });
};

/**
 * Get all completed results for the lab
 */
const getResults = async (userId) => {
    const tech = await getTechnicianDetails(userId);
    const labId = tech.laboratory_id;
    if (!labId) return [];

    const result = await query(`
        SELECT lr.result_id, lr.completed_date, lt.test_name, 
               req.priority, pc.case_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name
        FROM laboratory_result lr
        JOIN laboratory_test lt ON lr.test_id = lt.test_id
        JOIN laboratory_request req ON lt.request_id = req.request_id
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        WHERE req.laboratory_id = $1
        ORDER BY lr.completed_date DESC
    `, [labId]);

    return result.rows;
};

/**
 * Get single result details
 */
const getResultById = async (userId, resultId) => {
    const tech = await getTechnicianDetails(userId);

    const result = await query(`
        SELECT lr.result_id, lr.findings, lr.interpretation, lr.completed_date, lr.report_file,
               lt.test_name, lt.remarks,
               req.request_id, req.priority,
               s.specimen_type,
               pc.case_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               tech_p.first_name || ' ' || tech_p.last_name AS technician_name
        FROM laboratory_result lr
        JOIN laboratory_test lt ON lr.test_id = lt.test_id
        JOIN laboratory_request req ON lt.request_id = req.request_id
        JOIN specimen s ON req.specimen_id = s.specimen_id
        JOIN examination e ON s.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        JOIN laboratory_technician tech ON lt.technician_id = tech.technician_id
        JOIN person tech_p ON tech.person_id = tech_p.person_id
        WHERE lr.result_id = $1 AND req.laboratory_id = $2
    `, [resultId, tech.laboratory_id]);

    if (result.rowCount === 0) {
        throw new Error('Result not found.');
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

module.exports = {
    getDashboardStats,
    getRequests,
    getRequestById,
    updateRequestStatus,
    startTest,
    submitResult,
    getResults,
    getResultById
};
