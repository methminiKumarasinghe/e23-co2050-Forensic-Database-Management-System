const pool = require('../database/connection');

// --- NOTIFICATIONS & AUDIT LOGS ---
const logActivity = async (client, userId, action, entityName, entityId, description) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(query, [userId, action, entityName, entityId, description]);
};

const notifyUser = async (client, userId, message, type) => {
    const query = `
        INSERT INTO notifications (user_id, message, notification_type)
        VALUES ($1, $2, $3)
    `;
    await client.query(query, [userId, message, type]);
};

// General helper to map User to Lab Technician
const getTechnicianDataByUserId = async (userId) => {
  const query = `
    SELECT t.technician_id, t.hospital_id 
    FROM laboratory_technician t
    JOIN person p ON t.person_id = p.person_id
    WHERE p.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

// --- MODULE 1: Dashboard ---
const getDashboardStats = async (hospitalId) => {
  const query = `
    WITH lab_requests AS (
        SELECT lr.request_id, lr.status 
        FROM laboratory_request lr
        JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
        WHERE l.hospital_id = $1
    ),
    lab_tests AS (
        SELECT lt.test_id, lt.status
        FROM laboratory_test lt
        JOIN lab_requests lr ON lt.request_id = lr.request_id
    )
    SELECT
      (SELECT COUNT(*) FROM lab_requests WHERE status = 'PENDING') AS pending_requests,
      (SELECT COUNT(*) FROM lab_requests WHERE status = 'ACCEPTED') AS accepted_requests,
      (SELECT COUNT(*) FROM lab_requests WHERE status = 'REJECTED') AS rejected_requests,
      (SELECT COUNT(*) FROM lab_tests WHERE status = 'IN_PROGRESS') AS tests_in_progress,
      (SELECT COUNT(*) FROM lab_tests WHERE status = 'COMPLETED') AS completed_tests,
      (SELECT COUNT(DISTINCT s.specimen_id) FROM specimen s JOIN laboratory_request lr ON s.specimen_id = lr.specimen_id JOIN laboratory l ON lr.laboratory_id = l.laboratory_id WHERE l.hospital_id = $1) AS total_specimens_received,
      (SELECT COUNT(*) FROM laboratory_attachment la JOIN laboratory_result lres ON la.result_id = lres.result_id JOIN lab_tests lt ON lres.test_id = lt.test_id) AS reports_uploaded
  `;
  const result = await pool.query(query, [hospitalId]);
  
  const recentActivitiesQuery = `
    SELECT al.audit_id, al.action, al.description, al.created_at
    FROM audit_logs al
    WHERE al.user_id IN (
        SELECT p.user_id FROM laboratory_technician lt JOIN person p ON lt.person_id = p.person_id WHERE lt.hospital_id = $1
    )
    ORDER BY al.created_at DESC
    LIMIT 10
  `;
  const recentActivitiesResult = await pool.query(recentActivitiesQuery, [hospitalId]);
  
  return {
    stats: result.rows[0],
    recentActivities: recentActivitiesResult.rows
  };
};

// --- MODULE 2: Laboratory Requests ---
const getLabRequests = async (hospitalId, filters) => {
  let query = `
    SELECT lr.*, l.laboratory_name, s.specimen_type,
           pc.case_number, pp.first_name AS patient_first_name, pp.last_name AS patient_last_name
    FROM laboratory_request lr
    JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
    JOIN specimen s ON lr.specimen_id = s.specimen_id
    LEFT JOIN examination e ON s.examination_id = e.examination_id
    LEFT JOIN mlef m ON e.mlef_id = m.mlef_id
    LEFT JOIN police_case pc ON m.case_id = pc.case_id
    LEFT JOIN patient pt ON m.patient_id = pt.patient_id
    LEFT JOIN person pp ON pt.person_id = pp.person_id
    WHERE l.hospital_id = $1
  `;
  const values = [hospitalId];
  let idx = 2;

  if (filters.status) {
    query += ` AND lr.status = $${idx++}`;
    values.push(filters.status);
  }
  if (filters.priority) {
    query += ` AND lr.priority = $${idx++}`;
    values.push(filters.priority);
  }
  if (filters.date) {
    query += ` AND DATE(lr.request_date) = $${idx++}`;
    values.push(filters.date);
  }

  query += ` ORDER BY lr.request_date DESC`;
  
  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    values.push(filters.limit);
  }
  if (filters.offset) {
    query += ` OFFSET $${idx++}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

const getLabRequestById = async (requestId, hospitalId) => {
  const query = `
    SELECT lr.*, l.laboratory_name, s.specimen_type, s.collection_datetime, s.storage_condition, s.current_status as specimen_status,
           jmo.registration_number as jmo_reg, jp.first_name as jmo_first_name, jp.last_name as jmo_last_name,
           pt.medical_record_number, pp.first_name as patient_first_name, pp.last_name as patient_last_name,
           pc.case_number
    FROM laboratory_request lr
    JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
    JOIN specimen s ON lr.specimen_id = s.specimen_id
    JOIN judicial_medical_officer jmo ON lr.requested_by = jmo.jmo_id
    JOIN person jp ON jmo.person_id = jp.person_id
    JOIN examination e ON s.examination_id = e.examination_id
    JOIN mlef m ON e.mlef_id = m.mlef_id
    JOIN patient pt ON m.patient_id = pt.patient_id
    JOIN person pp ON pt.person_id = pp.person_id
    JOIN police_case pc ON m.case_id = pc.case_id
    WHERE lr.request_id = $1 AND l.hospital_id = $2
  `;
  const result = await pool.query(query, [requestId, hospitalId]);
  const request = result.rows[0];

  if (request) {
      const tests = await pool.query(`SELECT * FROM laboratory_test WHERE request_id = $1`, [requestId]);
      request.tests = tests.rows;
  }
  return request;
};

// --- MODULE 3: Accept / Reject Request ---
const updateRequestStatus = async (requestId, status, technicianId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const query = `
      UPDATE laboratory_request 
      SET status = $1, accepted_by = $2, accepted_date = CURRENT_TIMESTAMP
      WHERE request_id = $3 RETURNING *
    `;
    const result = await client.query(query, [status, technicianId, requestId]);
    const updatedRequest = result.rows[0];
    
    await logActivity(client, userId, `Request ${status}`, 'laboratory_request', requestId, `Laboratory request was ${status.toLowerCase()}.`);

    // Notify JMO
    const jmoQuery = `SELECT p.user_id FROM judicial_medical_officer jmo JOIN person p ON jmo.person_id = p.person_id WHERE jmo.jmo_id = $1`;
    const jmoResult = await client.query(jmoQuery, [updatedRequest.requested_by]);
    if (jmoResult.rows.length > 0) {
        await notifyUser(client, jmoResult.rows[0].user_id, `Your laboratory request for Specimen ${updatedRequest.specimen_id} was ${status.toLowerCase()}.`, 'LAB_REQUEST_UPDATE');
    }

    await client.query('COMMIT');
    return updatedRequest;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 4: Specimen Management ---
const getSpecimens = async (hospitalId) => {
    const query = `
        SELECT s.*, pp.first_name AS patient_first_name, pp.last_name AS patient_last_name
        FROM specimen s
        JOIN laboratory_request lr ON s.specimen_id = lr.specimen_id
        JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
        LEFT JOIN examination e ON s.examination_id = e.examination_id
        LEFT JOIN mlef m ON e.mlef_id = m.mlef_id
        LEFT JOIN patient pt ON m.patient_id = pt.patient_id
        LEFT JOIN person pp ON pt.person_id = pp.person_id
        WHERE l.hospital_id = $1
    `;
    const result = await pool.query(query, [hospitalId]);
    return result.rows;
};

const getSpecimenById = async (specimenId, hospitalId) => {
    const query = `
        SELECT s.* 
        FROM specimen s
        JOIN laboratory_request lr ON s.specimen_id = lr.specimen_id
        JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
        WHERE s.specimen_id = $1 AND l.hospital_id = $2
    `;
    const result = await pool.query(query, [specimenId, hospitalId]);
    return result.rows[0];
};

// --- MODULE 5: Laboratory Tests ---
const getTests = async (hospitalId) => {
    const query = `
        SELECT lt.*, pc.case_number, pp.first_name AS patient_first_name, pp.last_name AS patient_last_name
        FROM laboratory_test lt
        JOIN laboratory_request lr ON lt.request_id = lr.request_id
        JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
        JOIN specimen s ON lr.specimen_id = s.specimen_id
        LEFT JOIN examination e ON s.examination_id = e.examination_id
        LEFT JOIN mlef m ON e.mlef_id = m.mlef_id
        LEFT JOIN police_case pc ON m.case_id = pc.case_id
        LEFT JOIN patient pt ON m.patient_id = pt.patient_id
        LEFT JOIN person pp ON pt.person_id = pp.person_id
        WHERE l.hospital_id = $1
    `;
    const result = await pool.query(query, [hospitalId]);
    return result.rows;
};

const createTest = async (testData, technicianId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO laboratory_test (request_id, test_name, test_category, expected_completion_date, status, technician_id, started_at)
      VALUES ($1, $2, $3, $4, 'PENDING', $5, CURRENT_TIMESTAMP) RETURNING *
    `;
    const values = [testData.request_id, testData.test_name, testData.test_category, testData.expected_completion_date, technicianId];
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Test Created', 'laboratory_test', result.rows[0].test_id, 'Laboratory test created.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateTest = async (testId, updateData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = [];
    const values = [];
    let idx = 1;
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${idx++}`);
      values.push(updateData[key]);
    });
    if (fields.length === 0) return null;
    values.push(testId);
    
    const query = `UPDATE laboratory_test SET ${fields.join(', ')} WHERE test_id = $${idx} RETURNING *`;
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Test Updated', 'laboratory_test', testId, 'Laboratory test updated.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 6: Laboratory Results ---
const getResults = async (hospitalId) => {
    const query = `
        SELECT lres.*, lt.test_name, pc.case_number, pp.first_name AS patient_first_name, pp.last_name AS patient_last_name
        FROM laboratory_result lres
        JOIN laboratory_test lt ON lres.test_id = lt.test_id
        JOIN laboratory_request lr ON lt.request_id = lr.request_id
        JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
        JOIN specimen s ON lr.specimen_id = s.specimen_id
        LEFT JOIN examination e ON s.examination_id = e.examination_id
        LEFT JOIN mlef m ON e.mlef_id = m.mlef_id
        LEFT JOIN police_case pc ON m.case_id = pc.case_id
        LEFT JOIN patient pt ON m.patient_id = pt.patient_id
        LEFT JOIN person pp ON pt.person_id = pp.person_id
        WHERE l.hospital_id = $1
    `;
    const result = await pool.query(query, [hospitalId]);
    return result.rows;
};

const createResult = async (resultData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const checkQuery = `SELECT * FROM laboratory_result WHERE test_id = $1`;
    const checkResult = await client.query(checkQuery, [resultData.test_id]);
    if (checkResult.rows.length > 0) throw new Error("Result already exists for this test.");

    const query = `
      INSERT INTO laboratory_result (test_id, findings, interpretation, completed_date)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *
    `;
    const values = [resultData.test_id, resultData.findings, resultData.interpretation];
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Result Uploaded', 'laboratory_result', result.rows[0].result_id, 'Laboratory result uploaded.');

    // Notify JMO
    const jmoQuery = `
        SELECT p.user_id 
        FROM judicial_medical_officer jmo 
        JOIN person p ON jmo.person_id = p.person_id 
        JOIN laboratory_request lr ON lr.requested_by = jmo.jmo_id
        JOIN laboratory_test lt ON lt.request_id = lr.request_id
        WHERE lt.test_id = $1
    `;
    const jmoResult = await client.query(jmoQuery, [resultData.test_id]);
    if (jmoResult.rows.length > 0) {
        await notifyUser(client, jmoResult.rows[0].user_id, `A result was uploaded for test ${resultData.test_id}.`, 'LAB_RESULT_UPLOADED');
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

const updateResult = async (resultId, updateData, userId) => {
  const fields = [];
  const values = [];
  let idx = 1;
  Object.keys(updateData).forEach(key => {
    fields.push(`${key} = $${idx++}`);
    values.push(updateData[key]);
  });
  if (fields.length === 0) return null;
  values.push(resultId);
  const query = `UPDATE laboratory_result SET ${fields.join(', ')} WHERE result_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

// --- MODULE 7: Upload Result Attachments ---
const uploadAttachment = async (resultId, filePath, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO laboratory_attachment (result_id, file_path)
      VALUES ($1, $2) RETURNING *
    `;
    const result = await client.query(query, [resultId, filePath]);
    await logActivity(client, userId, 'Attachment Uploaded', 'laboratory_attachment', result.rows[0].attachment_id, 'Laboratory attachment uploaded.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 8: Complete Laboratory Test ---
const completeTest = async (testId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const testQuery = `UPDATE laboratory_test SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE test_id = $1 RETURNING *`;
    const testResult = await client.query(testQuery, [testId]);
    const test = testResult.rows[0];
    
    await logActivity(client, userId, 'Test Completed', 'laboratory_test', testId, 'Laboratory test marked as completed.');

    // Check if all tests for this request are completed
    const allTestsQuery = `SELECT status FROM laboratory_test WHERE request_id = $1`;
    const allTestsResult = await client.query(allTestsQuery, [test.request_id]);
    
    const allCompleted = allTestsResult.rows.every(t => t.status === 'COMPLETED');
    
    if (allCompleted) {
        await client.query(`UPDATE laboratory_request SET status = 'COMPLETED' WHERE request_id = $1`, [test.request_id]);
        await logActivity(client, userId, 'Request Completed', 'laboratory_request', test.request_id, 'All tests completed. Request marked as completed.');
        
        // Notify JMO
        const jmoQuery = `
            SELECT p.user_id 
            FROM judicial_medical_officer jmo 
            JOIN person p ON jmo.person_id = p.person_id 
            JOIN laboratory_request lr ON lr.requested_by = jmo.jmo_id
            WHERE lr.request_id = $1
        `;
        const jmoResult = await client.query(jmoQuery, [test.request_id]);
        if (jmoResult.rows.length > 0) {
            await notifyUser(client, jmoResult.rows[0].user_id, `All tests for request ${test.request_id} have been completed.`, 'LAB_REQUEST_COMPLETED');
        }
    }

    await client.query('COMMIT');
    return test;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 9: Search ---
const search = async (hospitalId, { query_text, limit, offset }) => {
  let query = `
    SELECT lr.request_id, lr.priority, lr.status, pt.medical_record_number, p.first_name, p.last_name, pc.case_number, m.mlef_id, lt.test_name
    FROM laboratory_request lr
    JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
    JOIN specimen s ON lr.specimen_id = s.specimen_id
    JOIN examination e ON s.examination_id = e.examination_id
    JOIN mlef m ON e.mlef_id = m.mlef_id
    JOIN patient pt ON m.patient_id = pt.patient_id
    JOIN person p ON pt.person_id = p.person_id
    JOIN police_case pc ON m.case_id = pc.case_id
    LEFT JOIN laboratory_test lt ON lt.request_id = lr.request_id
    WHERE l.hospital_id = $1
  `;
  const values = [hospitalId];
  let idx = 2;

  if (query_text) {
    query += ` AND (p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx} OR pc.case_number ILIKE $${idx} OR CAST(m.mlef_id AS TEXT) ILIKE $${idx} OR lt.test_name ILIKE $${idx} OR CAST(lr.request_id AS TEXT) ILIKE $${idx})`;
    values.push(`%${query_text}%`);
    idx++;
  }
  
  if (limit) {
    query += ` LIMIT $${idx++}`;
    values.push(limit);
  }
  if (offset) {
    query += ` OFFSET $${idx++}`;
    values.push(offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

// --- MODULE 10: Activity Timeline ---
const getActivityTimeline = async (hospitalId) => {
    // Return all audit logs for laboratory activities in this hospital
    const query = `
        SELECT al.audit_id, al.action, al.description, al.created_at, u.username
        FROM audit_logs al
        JOIN users u ON al.user_id = u.user_id
        JOIN person p ON u.user_id = p.user_id
        JOIN laboratory_technician lt ON lt.person_id = p.person_id
        WHERE lt.hospital_id = $1
        ORDER BY al.created_at DESC
    `;
    const result = await pool.query(query, [hospitalId]);
    return result.rows;
};

module.exports = {
  getTechnicianDataByUserId,
  getDashboardStats,
  getLabRequests, getLabRequestById,
  updateRequestStatus,
  getSpecimens, getSpecimenById,
  getTests, createTest, updateTest,
  getResults, createResult, updateResult,
  uploadAttachment,
  completeTest,
  search,
  getActivityTimeline
};
