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
 * Get all assigned MLEF cases for the logged-in JMO
 */
const getAssignedMlefs = async (userId) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (err) {
        console.warn('JMO profile warning:', err.message);
    }

    let sql = `
        SELECT m.mlef_id, m.case_id, m.patient_id, m.request_date, m.reason, m.status,
               pc.case_number, pc.case_type, pc.title AS case_title,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               ps.station_name,
               e.examination_id, e.examination_date, e.created_at AS assigned_date,
               (SELECT COUNT(*)::int FROM mlef m2 WHERE m2.request_date <= m.request_date) AS seq_num
        FROM mlef m
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN police_station ps ON pc.station_id = ps.station_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        LEFT JOIN examination e ON m.mlef_id = e.mlef_id
    `;
    const params = [];

    if (jmoId) {
        sql += ` WHERE e.jmo_id = $1 OR m.status = 'ASSIGNED' OR m.status = 'COMPLETED'`;
        params.push(jmoId);
    } else {
        sql += ` WHERE m.status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')`;
    }

    sql += ` ORDER BY m.request_date DESC`;

    const result = await query(sql, params);
    return result.rows.map(r => ({
        ...r,
        formatted_mlef_id: `MLEF-${String(r.seq_num).padStart(6, '0')}`
    }));
};

/**
 * Get read-only Police information for MLEF
 */
const getMlefPoliceDetails = async (userId, mlefId) => {
    const result = await query(`
        SELECT m.mlef_id, m.request_date, m.reason AS mlef_reason, m.status,
               pc.case_number, pc.case_type, pc.title AS case_title, pc.description AS case_description, pc.date_reported,
               ps.station_name, ps.district AS station_district, ps.telephone AS station_phone,
               off_p.first_name || ' ' || off_p.last_name AS requesting_officer_name, po.badge_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               pat_p.nic, pat_p.gender, pat_p.date_of_birth, pat_p.address AS patient_address, pat_p.telephone AS patient_phone,
               pat.blood_group, pat.medical_record_number, pat.emergency_contact, pat.emergency_phone,
               h.hospital_name,
               (SELECT COUNT(*)::int FROM mlef m2 WHERE m2.request_date <= m.request_date) AS seq_num
        FROM mlef m
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN police_station ps ON pc.station_id = ps.station_id
        JOIN police_officer po ON m.requesting_officer = po.officer_id
        JOIN person off_p ON po.person_id = off_p.person_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        JOIN hospital h ON m.hospital_id = h.hospital_id
        WHERE m.mlef_id = $1
    `, [mlefId]);

    if (result.rowCount === 0) {
        throw new Error('MLEF record not found.');
    }

    const row = result.rows[0];
    return {
        ...row,
        formatted_mlef_id: `MLEF-${String(row.seq_num).padStart(6, '0')}`
    };
};

/**
 * Submit JMO Examination Form (Section B)
 */
const submitMlefExamination = async (userId, mlefId, examData) => {
    const jmo = await getJmoDetails(userId);
    const {
        nic, consent, officerProducedBy, hospitalName, ward, bhtNumber,
        admissionDate, examDateTime, dischargeDate,
        bodilyHarm, internalInjuries, otherInjuries,
        causativeWeapon, categoryOfHurt, endangersLife,
        alcoholExam, sexualAssault, history,
        investigations, referrals, otherOpinions, remarks
    } = examData;

    const examinationNotes = `
[PART B: JMO MEDICAL EXAMINATION]
Identification (NIC/Passport): ${nic || 'N/A'}
Consent: ${consent || 'Given'}

Admission & Production Details:
- Officer Produced By: ${officerProducedBy || 'N/A'}
- Hospital: ${hospitalName || 'N/A'}
- Ward: ${ward || 'N/A'}
- B.H.T. No.: ${bhtNumber || 'N/A'}
- Date of Admission: ${admissionDate || 'N/A'}
- Date of Discharge: ${dischargeDate || 'N/A'}

Nature of Bodily Harm:
- Injuries Present: ${Array.isArray(bodilyHarm) ? bodilyHarm.join(', ') : bodilyHarm || 'None'}
- Internal Injuries: ${internalInjuries || 'None'}
- Other Injuries: ${otherInjuries || 'None'}

Nature of Causative Weapon & Category of Hurt:
- Causative Weapon: ${Array.isArray(causativeWeapon) ? causativeWeapon.join(', ') : causativeWeapon || 'Unspecified'}
- Category of Hurt: ${categoryOfHurt || 'Non-grievous'}
- Endangers Life: ${endangersLife || 'No'}

Alcohol / Drugs & Sexual Assault:
- Alcohol/Drugs Exam: ${Array.isArray(alcoholExam) ? alcoholExam.join(', ') : alcoholExam || 'Negative'}
- Sexual Assault Findings: ${Array.isArray(sexualAssault) ? sexualAssault.join(', ') : sexualAssault || 'None'}
- History given by examinee: ${history || 'N/A'}

Conclusions & Opinions:
- Investigations: ${investigations || 'None'}
- Referrals: ${referrals || 'None'}
- Other Opinions: ${otherOpinions || 'None'}
- Remarks: ${remarks || 'None'}
    `.trim();

    const conclusion = `Category of Hurt: ${categoryOfHurt || 'Non-grievous'}. Life Endangering: ${endangersLife || 'No'}. Recommendations/Opinions: ${otherOpinions || 'None'}. Remarks: ${remarks || 'None'}`;

    return withTransaction(async (client) => {
        const existingExam = await client.query(
            `SELECT examination_id FROM examination WHERE mlef_id = $1`,
            [mlefId]
        );

        let examId;
        const examDate = examDateTime ? new Date(examDateTime) : new Date();

        if (existingExam.rowCount > 0) {
            examId = existingExam.rows[0].examination_id;
            await client.query(`
                UPDATE examination 
                SET jmo_id = $1, status_id = 3, examination_date = $2, examination_notes = $3, conclusion = $4
                WHERE examination_id = $5
            `, [jmo.jmo_id, examDate, examinationNotes, conclusion, examId]);
        } else {
            const newExam = await client.query(`
                INSERT INTO examination (mlef_id, jmo_id, status_id, examination_date, examination_notes, conclusion)
                VALUES ($1, $2, 3, $3, $4, $5)
                RETURNING examination_id
            `, [mlefId, jmo.jmo_id, examDate, examinationNotes, conclusion]);
            examId = newExam.rows[0].examination_id;
        }

        await client.query(
            `UPDATE mlef SET status = 'COMPLETED' WHERE mlef_id = $1`,
            [mlefId]
        );

        const reportNo = 'MLR-' + Date.now();
        await client.query(`
            INSERT INTO medico_legal_report (examination_id, report_number, findings, medical_opinion, recommendations, report_status)
            VALUES ($1, $2, $3, $4, $5, 'DRAFT')
            ON CONFLICT (examination_id)
            DO UPDATE SET findings = EXCLUDED.findings, medical_opinion = EXCLUDED.medical_opinion, recommendations = EXCLUDED.recommendations
        `, [examId, reportNo, examinationNotes, conclusion, otherOpinions || 'None']);

        await client.query(`
            INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
            VALUES ($1, 'COMPLETE_MLEF_EXAM', 'examination', $2, 'JMO completed MLEF Examination')
        `, [userId, examId]);

        return { examination_id: examId, mlef_id: mlefId, status: 'COMPLETED' };
    });
};

/**
 * Get full completed MLEF Report (Police Section + JMO Section)
 */
const getMlefReport = async (userId, mlefId) => {
    const policeDetails = await getMlefPoliceDetails(userId, mlefId);

    const examResult = await query(`
        SELECT e.examination_id, e.examination_date, e.examination_notes, e.conclusion, e.created_at,
               jmo_p.first_name || ' ' || jmo_p.last_name AS jmo_name, jmo.registration_number AS jmo_reg_no,
               h.hospital_name
        FROM examination e
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
        JOIN hospital h ON jmo.hospital_id = h.hospital_id
        WHERE e.mlef_id = $1
    `, [mlefId]);

    const exam = examResult.rows[0] || null;

    return {
        policeSection: policeDetails,
        jmoSection: exam
    };
};

/**
 * Get JMO Medico-Legal Reports (MLR)
 */
const getMlrReports = async (userId) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (e) {}

    const result = await query(`
        SELECT mlr.report_id, mlr.report_number, mlr.findings, mlr.medical_opinion, mlr.recommendations, mlr.report_status, mlr.prepared_date,
               pc.case_number, pc.title AS case_title,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               m.mlef_id
        FROM medico_legal_report mlr
        JOIN examination e ON mlr.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        WHERE ($1::uuid IS NULL OR e.jmo_id = $1)
        ORDER BY mlr.prepared_date DESC
    `, [jmoId]);

    return result.rows;
};

/**
 * Get JMO Autopsies / Post-Mortem Records
 */
const getAutopsies = async (userId) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (e) {}

    const result = await query(`
        SELECT d.deceased_id, d.date_of_death, d.place_of_death, d.identified, d.identification_notes,
               p.first_name || ' ' || p.last_name AS deceased_name, p.nic, p.gender
        FROM deceased d
        JOIN person p ON d.person_id = p.person_id
        ORDER BY d.date_of_death DESC
    `);

    return result.rows;
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
    getAssignedMlefs,
    getMlefPoliceDetails,
    submitMlefExamination,
    getMlefReport,
    getMlrReports,
    getAutopsies,
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
