const pool = require('../database/connection');

const logActivity = async (client, userId, action, entityName, entityId, description) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(query, [userId, action, entityName, entityId, description]);
};

// Map User to Staff
const getStaffDataByUserId = async (userId) => {
    const query = `
      SELECT fs.staff_id, fs.hospital_id 
      FROM forensic_staff fs
      JOIN person p ON fs.person_id = p.person_id
      WHERE p.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

// --- MODULE 1: Dashboard Overview ---
const getDashboardStats = async (hospitalId) => {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM police_case WHERE status_id = 2) AS active_cases,
        (SELECT COUNT(*) FROM mlef WHERE status = 'PENDING') AS pending_mlef,
        (SELECT COUNT(*) FROM examination WHERE status_id = 1) AS pending_examinations,
        (SELECT COUNT(*) FROM laboratory_request WHERE status = 'PENDING') AS pending_lab_requests,
        (SELECT COUNT(*) FROM medico_legal_report WHERE report_status = 'COMPLETED' OR report_status = 'SIGNED') AS completed_reports,
        (SELECT COUNT(*) FROM appointment WHERE status = 'SCHEDULED') AS upcoming_appointments
    `;
    const result = await pool.query(query);
    
    const recentActivitiesQuery = `
      SELECT activity_type, description, activity_time 
      FROM case_activity 
      ORDER BY activity_time DESC 
      LIMIT 5
    `;
    const recentActivities = await pool.query(recentActivitiesQuery);

    const recentDocsQuery = `
      SELECT report_number as document_name, prepared_date as upload_date, 'Medico-Legal Report' as doc_type
      FROM medico_legal_report
      ORDER BY prepared_date DESC
      LIMIT 5
    `;
    const recentDocs = await pool.query(recentDocsQuery);

    return {
        stats: result.rows[0],
        recentActivities: recentActivities.rows,
        recentDocuments: recentDocs.rows
    };
};

// --- MODULE 2: Case Monitoring ---
const getCases = async (filters) => {
    let query = `
        SELECT 
            pc.case_id, 
            pc.case_number, 
            ps.station_name, 
            (
                SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Unknown')
                FROM mlef m 
                JOIN patient pat ON m.patient_id = pat.patient_id
                JOIN person p ON pat.person_id = p.person_id
                WHERE m.case_id = pc.case_id
                LIMIT 1
            ) as patient_name,
            (
                SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Unassigned')
                FROM examination e
                JOIN forensic_staff fs ON e.jmo_id = fs.staff_id
                JOIN person p ON fs.person_id = p.person_id
                WHERE e.case_id = pc.case_id
                LIMIT 1
            ) as assigned_jmo,
            (SELECT m.status FROM mlef m WHERE m.case_id = pc.case_id LIMIT 1) as mlef_status,
            (
                SELECT es.status_name 
                FROM examination e
                JOIN examination_status es ON e.status_id = es.status_id
                WHERE e.case_id = pc.case_id
                LIMIT 1
            ) as examination_status,
            (
                SELECT lr.status 
                FROM examination e
                JOIN laboratory_request lr ON e.examination_id = lr.examination_id
                WHERE e.case_id = pc.case_id
                LIMIT 1
            ) as laboratory_status
        FROM police_case pc
        JOIN police_station ps ON pc.station_id = ps.station_id
        WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (filters.case_number) {
        query += ` AND pc.case_number ILIKE $${idx++}`;
        values.push(`%${filters.case_number}%`);
    }
    if (filters.status) {
        query += ` AND cs.status_name = $${idx++}`;
        values.push(filters.status);
    }
    if (filters.station) {
        query += ` AND ps.station_name ILIKE $${idx++}`;
        values.push(`%${filters.station}%`);
    }
    
    query += ` ORDER BY pc.date_reported DESC`;
    const result = await pool.query(query, values);
    return result.rows;
};

const getCaseById = async (caseId) => {
    const query = `
        SELECT pc.*, cs.status_name as status, ps.station_name
        FROM police_case pc
        JOIN case_status cs ON pc.status_id = cs.status_id
        JOIN police_station ps ON pc.station_id = ps.station_id
        WHERE pc.case_id = $1
    `;
    const result = await pool.query(query, [caseId]);
    return result.rows[0];
};

// --- MODULE 3: Case Progress Tracking (Timeline) ---
const getCaseTimeline = async (caseId) => {
    const timeline = [];
    
    // 1. Case created
    const cResult = await pool.query(`SELECT date_reported, created_at FROM police_case WHERE case_id = $1`, [caseId]);
    if (cResult.rows.length > 0) {
        timeline.push({ stage: 'Case Created', date: cResult.rows[0].created_at, details: 'Police case registered' });
    }

    // 2. Officer assigned
    const aResult = await pool.query(`SELECT assigned_date FROM case_assignment WHERE case_id = $1 ORDER BY assigned_date ASC LIMIT 1`, [caseId]);
    if (aResult.rows.length > 0) {
        timeline.push({ stage: 'Officer Assigned', date: aResult.rows[0].assigned_date, details: 'Investigating officer assigned' });
    }

    // 3. Evidence collected
    const eResult = await pool.query(`SELECT collected_date FROM evidence WHERE case_id = $1 ORDER BY collected_date ASC LIMIT 1`, [caseId]);
    if (eResult.rows.length > 0) {
        timeline.push({ stage: 'Evidence Collected', date: eResult.rows[0].collected_date, details: 'Initial evidence collected' });
    }

    // 4. MLEF Requested
    const mResult = await pool.query(`SELECT request_date, mlef_id FROM mlef WHERE case_id = $1 ORDER BY request_date ASC`, [caseId]);
    for (const mlef of mResult.rows) {
        timeline.push({ stage: 'MLEF Requested', date: mlef.request_date, details: 'MLEF registered' });
        
        // 5. Medical Examination
        const examResult = await pool.query(`SELECT created_at, examination_id FROM examination WHERE mlef_id = $1`, [mlef.mlef_id]);
        for (const exam of examResult.rows) {
            timeline.push({ stage: 'Medical Examination Completed', date: exam.created_at, details: 'Examination finalized' });
            
            // 6. Report Generated
            const repResult = await pool.query(`SELECT prepared_date FROM medico_legal_report WHERE examination_id = $1`, [exam.examination_id]);
            if (repResult.rows.length > 0) {
                timeline.push({ stage: 'Report Generated', date: repResult.rows[0].prepared_date, details: 'Medico-legal report issued' });
            }
            
            // Lab requests
            const labResult = await pool.query(`
                SELECT lr.request_date, lt.completed_at
                FROM laboratory_request lr
                JOIN specimen s ON lr.specimen_id = s.specimen_id
                LEFT JOIN laboratory_test lt ON lt.request_id = lr.request_id
                WHERE s.examination_id = $1
            `, [exam.examination_id]);
            
            for (const lab of labResult.rows) {
                timeline.push({ stage: 'Laboratory Processing Started', date: lab.request_date, details: 'Specimen sent to lab' });
                if (lab.completed_at) {
                    timeline.push({ stage: 'Laboratory Testing Completed', date: lab.completed_at, details: 'Lab results available' });
                }
            }
        }
    }

    // Sort by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    return timeline;
};

// --- MODULE 4: MLEF Monitoring ---
const getMlefRequests = async () => {
    const query = `
        SELECT m.*, pc.case_number, h.hospital_name, pt.medical_record_number
        FROM mlef m
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN hospital h ON m.hospital_id = h.hospital_id
        JOIN patient pt ON m.patient_id = pt.patient_id
        ORDER BY m.request_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getMlefById = async (mlefId) => {
    const query = `
        SELECT m.*, pc.case_number, h.hospital_name, pt.medical_record_number
        FROM mlef m
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN hospital h ON m.hospital_id = h.hospital_id
        JOIN patient pt ON m.patient_id = pt.patient_id
        WHERE m.mlef_id = $1
    `;
    const result = await pool.query(query, [mlefId]);
    return result.rows[0];
};

// --- MODULE 5: Examination Monitoring ---
const getExaminations = async () => {
    const query = `
        SELECT e.examination_id, e.examination_date, es.status_name as status,
               jmo.registration_number as jmo_reg, m.mlef_id, pc.case_number
        FROM examination e
        JOIN examination_status es ON e.status_id = es.status_id
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getExaminationById = async (examId) => {
    const query = `
        SELECT e.examination_id, e.examination_date, es.status_name as status, e.conclusion,
               jmo.registration_number as jmo_reg, m.mlef_id, pc.case_number
        FROM examination e
        JOIN examination_status es ON e.status_id = es.status_id
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        WHERE e.examination_id = $1
    `;
    const result = await pool.query(query, [examId]);
    return result.rows[0];
};

// --- MODULE 6: Laboratory Monitoring ---
const getLabRequests = async () => {
    const query = `
        SELECT lr.request_id, lr.priority, lr.status, lr.request_date, l.laboratory_name
        FROM laboratory_request lr
        JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
        ORDER BY lr.request_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getLabResultById = async (resultId) => {
    const query = `
        SELECT lres.*, lt.test_name, lt.status as test_status
        FROM laboratory_result lres
        JOIN laboratory_test lt ON lres.test_id = lt.test_id
        WHERE lres.result_id = $1
    `;
    const result = await pool.query(query, [resultId]);
    return result.rows[0];
};

// --- MODULE 7: Document Management ---
const getDocuments = async () => {
    // Union of reports and lab attachments
    const query = `
        SELECT report_id as document_id, report_number as document_name, 'Medico-Legal Report' as document_type, prepared_date as created_at
        FROM medico_legal_report WHERE report_status = 'COMPLETED' OR report_status = 'SIGNED'
        UNION ALL
        SELECT attachment_id as document_id, file_path as document_name, 'Laboratory Result' as document_type, uploaded_at as created_at
        FROM laboratory_attachment
        ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getDocumentById = async (docId, type) => {
    if (type === 'report') {
        const query = `SELECT * FROM medico_legal_report WHERE report_id = $1`;
        const result = await pool.query(query, [docId]);
        return result.rows[0];
    } else {
        const query = `SELECT * FROM laboratory_attachment WHERE attachment_id = $1`;
        const result = await pool.query(query, [docId]);
        return result.rows[0];
    }
};

// --- MODULE 8: Appointment Management ---
const getAppointments = async (hospitalId) => {
    const query = `
        SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, 
               jp.first_name as jmo_first_name, jp.last_name as jmo_last_name
        FROM appointment a
        JOIN patient pt ON a.patient_id = pt.patient_id
        JOIN person p ON pt.person_id = p.person_id
        JOIN judicial_medical_officer jmo ON a.jmo_id = jmo.jmo_id
        JOIN person jp ON jmo.person_id = jp.person_id
        WHERE jmo.hospital_id = $1
        ORDER BY a.appointment_date ASC
    `;
    const result = await pool.query(query, [hospitalId]);
    return result.rows;
};

const createAppointment = async (apptData, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = `
            INSERT INTO appointment (jmo_id, patient_id, mlef_id, appointment_date, remarks)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const values = [apptData.jmo_id, apptData.patient_id, apptData.mlef_id || null, apptData.appointment_date, apptData.remarks];
        const result = await client.query(query, values);
        
        await logActivity(client, userId, 'Appointment Created', 'appointment', result.rows[0].appointment_id, 'New appointment scheduled.');
        
        // Notify JMO
        const jmoQuery = `SELECT p.user_id FROM judicial_medical_officer jmo JOIN person p ON jmo.person_id = p.person_id WHERE jmo.jmo_id = $1`;
        const jmoResult = await client.query(jmoQuery, [apptData.jmo_id]);
        if (jmoResult.rows.length > 0) {
            await notifyUser(client, jmoResult.rows[0].user_id, `A new appointment has been scheduled for you on ${apptData.appointment_date}.`, 'APPOINTMENT_SCHEDULED');
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateAppointment = async (apptId, updateData, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = `UPDATE appointment SET status = $1 WHERE appointment_id = $2 RETURNING *`;
        const result = await client.query(query, [updateData.status, apptId]);
        
        await logActivity(client, userId, 'Appointment Updated', 'appointment', apptId, `Appointment status updated to ${updateData.status}.`);
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// --- MODULE 9: Notifications ---
const getNotifications = async (userId) => {
    const query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const markNotificationRead = async (notificationId, userId) => {
    const query = `
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE notification_id = $1 AND user_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    
    // Log activity
    const client = await pool.connect();
    await logActivity(client, userId, 'Notification Read', 'notifications', notificationId, 'Notification marked as read.');
    client.release();
    
    return result.rows[0];
};

// --- MODULE 10: Search ---
const search = async (queryText) => {
    let query = `
        SELECT pc.case_id, pc.case_number, 'Case' as entity_type, pc.title as details
        FROM police_case pc
        WHERE pc.case_number ILIKE $1 OR pc.title ILIKE $1
        UNION ALL
        SELECT m.mlef_id as case_id, CAST(m.mlef_id AS TEXT) as case_number, 'MLEF' as entity_type, pt.medical_record_number as details
        FROM mlef m
        JOIN patient pt ON m.patient_id = pt.patient_id
        WHERE CAST(m.mlef_id AS TEXT) ILIKE $1 OR pt.medical_record_number ILIKE $1
        UNION ALL
        SELECT pt.patient_id as case_id, pt.medical_record_number as case_number, 'Patient' as entity_type, p.first_name || ' ' || p.last_name as details
        FROM patient pt
        JOIN person p ON pt.person_id = p.person_id
        WHERE p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.nic ILIKE $1
    `;
    const result = await pool.query(query, [`%${queryText}%`]);
    return result.rows;
};


// --- MODULE 1B: Registration ---

const createPatient = async (data, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const personRes = await client.query(`
            INSERT INTO person (first_name, last_name, nic, gender, date_of_birth, telephone, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING person_id
        `, [data.first_name, data.last_name, data.nic, data.gender, data.date_of_birth, data.telephone, data.address]);
        
        const personId = personRes.rows[0].person_id;
        
        const patientRes = await client.query(`
            INSERT INTO patient (person_id, medical_record_number, blood_group, emergency_contact, emergency_phone)
            VALUES ($1, $2, $3, $4, $5) RETURNING patient_id
        `, [personId, `MRN-${Date.now()}`, data.blood_group || null, data.emergency_contact || null, data.emergency_phone || null]);
        
        await logActivity(client, userId, 'Patient Registered', 'patient', patientRes.rows[0].patient_id, 'Staff registered a new patient.');
        
        await client.query('COMMIT');
        return { patient_id: patientRes.rows[0].patient_id, person_id: personId };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getPatients = async () => {
    const query = `
        SELECT pt.patient_id, p.first_name, p.last_name, p.nic, pt.medical_record_number, p.gender, p.date_of_birth
        FROM patient pt
        JOIN person p ON pt.person_id = p.person_id
        ORDER BY p.created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows;
};

const getPatientById = async (id) => {
    const query = `
        SELECT pt.*, p.first_name, p.last_name, p.nic, p.gender, p.date_of_birth, p.telephone, p.address
        FROM patient pt
        JOIN person p ON pt.person_id = p.person_id
        WHERE pt.patient_id = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
};

const createDeceased = async (data, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const personRes = await client.query(`
            INSERT INTO person (first_name, last_name, nic, gender)
            VALUES ($1, $2, $3, $4) RETURNING person_id
        `, [data.first_name, data.last_name, data.nic || null, data.gender]);
        
        const personId = personRes.rows[0].person_id;
        
        const decRes = await client.query(`
            INSERT INTO deceased (person_id, date_of_death, place_of_death, identified, identification_notes)
            VALUES ($1, $2, $3, $4, $5) RETURNING deceased_id
        `, [personId, data.date_found, data.location_found, data.identification_status, `Estimated Age: ${data.estimated_age || 'Unknown'}`]);
        
        await logActivity(client, userId, 'Deceased Registered', 'deceased', decRes.rows[0].deceased_id, 'Staff registered a deceased person.');
        
        await client.query('COMMIT');
        return { deceased_id: decRes.rows[0].deceased_id, person_id: personId };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getDeceased = async () => {
    const query = `
        SELECT d.deceased_id, p.first_name, p.last_name, p.nic, d.date_of_death, d.place_of_death, d.identified
        FROM deceased d
        JOIN person p ON d.person_id = p.person_id
        ORDER BY d.date_of_death DESC NULLS LAST
    `;
    const res = await pool.query(query);
    return res.rows;
};

const getDeceasedById = async (id) => {
    const query = `
        SELECT d.*, p.first_name, p.last_name, p.nic, p.gender
        FROM deceased d
        JOIN person p ON d.person_id = p.person_id
        WHERE d.deceased_id = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
};

const createMlef = async (data, userId, staffId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Find requesting officer from case assignment
        const officerRes = await client.query(`SELECT officer_id FROM case_assignment WHERE case_id = $1 LIMIT 1`, [data.case_id]);
        if (officerRes.rows.length === 0) {
            throw new Error("No police officer assigned to this case to request MLEF.");
        }
        const officerId = officerRes.rows[0].officer_id;
        
        const mlefRes = await client.query(`
            INSERT INTO mlef (case_id, patient_id, requesting_officer, hospital_id, reason, status)
            VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING mlef_id
        `, [data.case_id, data.patient_id, officerId, data.hospital_id, data.reason]);
        
        await logActivity(client, userId, 'MLEF Created', 'mlef', mlefRes.rows[0].mlef_id, 'Staff created an MLEF request.');
        
        await client.query('COMMIT');
        return { mlef_id: mlefRes.rows[0].mlef_id };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getHospitals = async () => {
    const res = await pool.query('SELECT hospital_id, hospital_name, location FROM hospital ORDER BY hospital_name');
    return res.rows;
};

const getAvailableJmo = async () => {
    const res = await pool.query(`
        SELECT j.jmo_id, p.first_name, p.last_name, h.hospital_name, j.specialization
        FROM judicial_medical_officer j
        JOIN person p ON j.person_id = p.person_id
        JOIN hospital h ON j.hospital_id = h.hospital_id
    `);
    return res.rows;
};

const assignJmoToCase = async (caseId, data, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Assigning JMO to case via examination table since case_assignment is for police_officer
        // Find MLEF for this case
        const mlefRes = await client.query('SELECT mlef_id FROM mlef WHERE case_id = $1 LIMIT 1', [caseId]);
        if (mlefRes.rows.length === 0) {
             throw new Error("No MLEF found for this case. Cannot assign JMO.");
        }
        
        const mlefId = mlefRes.rows[0].mlef_id;
        
        // Ensure no duplicate assignment for this MLEF
        const checkRes = await client.query('SELECT examination_id FROM examination WHERE mlef_id = $1', [mlefId]);
        if (checkRes.rows.length > 0) {
            throw new Error("JMO is already assigned to this case/MLEF.");
        }
        
        const examRes = await client.query(`
            INSERT INTO examination (mlef_id, jmo_id, status_id, examination_date, examination_notes)
            VALUES ($1, $2, (SELECT status_id FROM examination_status WHERE status_name = 'PENDING'), $3, $4)
            RETURNING examination_id
        `, [mlefId, data.jmo_id, data.assignment_date, data.remarks || 'Assigned by staff']);
        
        await logActivity(client, userId, 'JMO Assigned', 'examination', examRes.rows[0].examination_id, 'Staff assigned a JMO to the case.');
        
        await client.query('COMMIT');
        return { examination_id: examRes.rows[0].examination_id };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    assignJmoToCase,
    getAvailableJmo,
    getHospitals,
    createMlef,
    getDeceasedById,
    getDeceased,
    createDeceased,
    getPatientById,
    getPatients,
    createPatient,
  getStaffDataByUserId,
  getDashboardStats,
  getCases, getCaseById, getCaseTimeline,
  getMlefRequests, getMlefById,
  getExaminations, getExaminationById,
  getLabRequests, getLabResultById,
  getDocuments, getDocumentById,
  getAppointments, createAppointment, updateAppointment,
  getNotifications, markNotificationRead,
  search,
  logActivity
};
