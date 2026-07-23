const { query, withTransaction } = require('../config/db');

/**
 * Auto-initialize autopsy_notification table if not exists
 */
const initAutopsyNotificationTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS autopsy_notification (
                autopsy_notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                case_id UUID REFERENCES police_case(case_id) ON DELETE CASCADE,
                jmo_id UUID REFERENCES judicial_medical_officer(jmo_id) ON DELETE SET NULL,
                hospital_name VARCHAR(255),
                post_mortem_serial_number VARCHAR(100),
                court_case_number VARCHAR(100),
                inquirer_name VARCHAR(255),
                inquirer_designation VARCHAR(255),
                inquirer_type VARCHAR(100),
                area VARCHAR(255),
                deceased_name VARCHAR(255),
                age VARCHAR(50),
                sex VARCHAR(50),
                place_of_death VARCHAR(100),
                hospital_name_if_applicable VARCHAR(255),
                bht_number VARCHAR(100),
                ward_number VARCHAR(100),
                date_of_death DATE,
                time_of_death VARCHAR(50),
                immediate_cause TEXT,
                cause_due_to_1 TEXT,
                cause_due_to_2 TEXT,
                cause_due_to_3 TEXT,
                contributory_causes TEXT,
                interval_between_onset_and_death VARCHAR(255),
                cause_under_investigation VARCHAR(20),
                specimens_retained VARCHAR(20),
                specimen_details TEXT,
                maternal_death VARCHAR(20),
                maternal_category VARCHAR(100),
                comments_opinions TEXT,
                conducting_jmo_name VARCHAR(255),
                designation VARCHAR(255),
                conducted_date DATE,
                expected_report_completion_time VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Pending Notification',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        console.warn('autopsy_notification init note:', e.message);
    }
};
initAutopsyNotificationTable();

/**
 * Helper to get JMO details based on user_id
 */
const getJmoDetails = async (userId) => {
    const result = await query(
        `SELECT jmo.jmo_id, jmo.hospital_id, p.first_name || ' ' || p.last_name AS jmo_name
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
 * Get Autopsy Assigned Cases for JMO
 */
const getAutopsyCases = async (userId) => {
    await initAutopsyNotificationTable();
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (e) {}

    let sql = `
        SELECT pc.case_id, pc.case_number, pc.case_type, pc.title AS case_title, pc.date_reported AS assigned_date,
               ps.station_name,
               d.deceased_id, d.date_of_death, d.place_of_death,
               p.first_name || ' ' || p.last_name AS deceased_name, p.gender,
               an.autopsy_notification_id, an.status AS autopsy_status, an.post_mortem_serial_number
        FROM police_case pc
        JOIN police_station ps ON pc.station_id = ps.station_id
        LEFT JOIN mlef m ON pc.case_id = m.case_id
        LEFT JOIN examination e ON m.mlef_id = e.mlef_id
        LEFT JOIN deceased d ON 1=1
        LEFT JOIN person p ON d.person_id = p.person_id
        LEFT JOIN autopsy_notification an ON pc.case_id = an.case_id
    `;

    const params = [];
    if (jmoId) {
        sql += ` WHERE (e.jmo_id = $1 OR an.jmo_id = $1 OR pc.case_type ILIKE '%death%' OR pc.case_type ILIKE '%homicide%' OR pc.case_type ILIKE '%autopsy%' OR m.status IN ('ASSIGNED', 'COMPLETED'))`;
        params.push(jmoId);
    }

    sql += ` ORDER BY pc.date_reported DESC`;

    const result = await query(sql, params);
    
    // Deduplicate by case_id
    const casesMap = new Map();
    for (let r of result.rows) {
        if (!casesMap.has(r.case_id)) {
            casesMap.set(r.case_id, {
                ...r,
                autopsy_status: r.autopsy_status || 'Pending Notification',
                deceased_name: r.deceased_name || 'Unknown Deceased Examinee'
            });
        }
    }

    return Array.from(casesMap.values());
};

/**
 * Get Autopsy Notification Data for a selected case
 */
const getAutopsyNotification = async (userId, caseId) => {
    await initAutopsyNotificationTable();
    const jmo = await getJmoDetails(userId);

    // Check existing notification record
    const existing = await query(`
        SELECT * FROM autopsy_notification WHERE case_id = $1
    `, [caseId]);

    if (existing.rowCount > 0) {
        return existing.rows[0];
    }

    // Fetch case and deceased defaults
    const caseRes = await query(`
        SELECT pc.case_id, pc.case_number, pc.case_type, pc.title,
               ps.station_name, ps.district,
               h.hospital_name
        FROM police_case pc
        JOIN police_station ps ON pc.station_id = ps.station_id
        LEFT JOIN mlef m ON pc.case_id = m.case_id
        LEFT JOIN hospital h ON m.hospital_id = h.hospital_id
        WHERE pc.case_id = $1
        LIMIT 1
    `, [caseId]);

    const caseData = caseRes.rows[0] || {};

    const decRes = await query(`
        SELECT d.deceased_id, d.date_of_death, d.place_of_death,
               p.first_name || ' ' || p.last_name AS deceased_name, p.gender, p.date_of_birth
        FROM deceased d
        JOIN person p ON d.person_id = p.person_id
        LIMIT 1
    `);

    const decData = decRes.rows[0] || {};

    return {
        case_id: caseId,
        hospital_name: caseData.hospital_name || 'Teaching Hospital Kandy',
        post_mortem_serial_number: 'PM-' + Date.now().toString().slice(-6),
        court_case_number: caseData.case_number || 'MC-KANDY-2026',
        inquirer_name: 'W. M. Bandara',
        inquirer_designation: 'Inquirer into Sudden Deaths',
        inquirer_type: 'Inquirer into Sudden Deaths',
        area: caseData.district || 'Kandy District',
        deceased_name: decData.deceased_name || 'Unidentified Deceased',
        age: '42 years',
        sex: decData.gender || 'Male',
        place_of_death: decData.place_of_death || 'Hospital admission',
        hospital_name_if_applicable: caseData.hospital_name || 'Teaching Hospital Kandy',
        bht_number: 'BHT-884920',
        ward_number: 'Ward 12',
        date_of_death: decData.date_of_death || new Date().toISOString().slice(0, 10),
        time_of_death: '14:30',
        immediate_cause: '',
        cause_due_to_1: '',
        cause_due_to_2: '',
        cause_due_to_3: '',
        contributory_causes: '',
        interval_between_onset_and_death: '',
        cause_under_investigation: 'Yes',
        specimens_retained: 'Yes',
        specimen_details: 'Blood, Visceral samples sent to Government Analyst Dept.',
        maternal_death: 'No',
        maternal_category: '',
        comments_opinions: '',
        conducting_jmo_name: jmo.jmo_name || 'Dr. Forensic Specialist',
        designation: 'Judicial Medical Officer',
        conducted_date: new Date().toISOString().slice(0, 10),
        expected_report_completion_time: '6 weeks',
        status: 'Pending Notification'
    };
};

/**
 * Save / Submit Autopsy Notification (Health 1328)
 */
const saveAutopsyNotification = async (userId, notificationData) => {
    await initAutopsyNotificationTable();
    const jmo = await getJmoDetails(userId);
    const {
        case_id, hospital_name, post_mortem_serial_number, court_case_number,
        inquirer_name, inquirer_designation, inquirer_type, area,
        deceased_name, age, sex, place_of_death, hospital_name_if_applicable,
        bht_number, ward_number, date_of_death, time_of_death,
        immediate_cause, cause_due_to_1, cause_due_to_2, cause_due_to_3,
        contributory_causes, interval_between_onset_and_death,
        cause_under_investigation, specimens_retained, specimen_details,
        maternal_death, maternal_category, comments_opinions,
        conducting_jmo_name, designation, conducted_date, expected_report_completion_time,
        status = 'Notification Completed'
    } = notificationData;

    const existing = await query(`SELECT autopsy_notification_id FROM autopsy_notification WHERE case_id = $1`, [case_id]);

    let result;
    if (existing.rowCount > 0) {
        result = await query(`
            UPDATE autopsy_notification SET
                jmo_id = $1, hospital_name = $2, post_mortem_serial_number = $3, court_case_number = $4,
                inquirer_name = $5, inquirer_designation = $6, inquirer_type = $7, area = $8,
                deceased_name = $9, age = $10, sex = $11, place_of_death = $12, hospital_name_if_applicable = $13,
                bht_number = $14, ward_number = $15, date_of_death = $16, time_of_death = $17,
                immediate_cause = $18, cause_due_to_1 = $19, cause_due_to_2 = $20, cause_due_to_3 = $21,
                contributory_causes = $22, interval_between_onset_and_death = $23,
                cause_under_investigation = $24, specimens_retained = $25, specimen_details = $26,
                maternal_death = $27, maternal_category = $28, comments_opinions = $29,
                conducting_jmo_name = $30, designation = $31, conducted_date = $32, expected_report_completion_time = $33,
                status = $34, updated_at = CURRENT_TIMESTAMP
            WHERE case_id = $35
            RETURNING *
        `, [
            jmo.jmo_id, hospital_name, post_mortem_serial_number, court_case_number,
            inquirer_name, inquirer_designation, inquirer_type, area,
            deceased_name, age, sex, place_of_death, hospital_name_if_applicable,
            bht_number, ward_number, date_of_death || null, time_of_death,
            immediate_cause, cause_due_to_1, cause_due_to_2, cause_due_to_3,
            contributory_causes, interval_between_onset_and_death,
            cause_under_investigation, specimens_retained, specimen_details,
            maternal_death, maternal_category, comments_opinions,
            conducting_jmo_name, designation, conducted_date || null, expected_report_completion_time,
            status, case_id
        ]);
    } else {
        result = await query(`
            INSERT INTO autopsy_notification (
                case_id, jmo_id, hospital_name, post_mortem_serial_number, court_case_number,
                inquirer_name, inquirer_designation, inquirer_type, area,
                deceased_name, age, sex, place_of_death, hospital_name_if_applicable,
                bht_number, ward_number, date_of_death, time_of_death,
                immediate_cause, cause_due_to_1, cause_due_to_2, cause_due_to_3,
                contributory_causes, interval_between_onset_and_death,
                cause_under_investigation, specimens_retained, specimen_details,
                maternal_death, maternal_category, comments_opinions,
                conducting_jmo_name, designation, conducted_date, expected_report_completion_time,
                status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
            )
            RETURNING *
        `, [
            case_id, jmo.jmo_id, hospital_name, post_mortem_serial_number, court_case_number,
            inquirer_name, inquirer_designation, inquirer_type, area,
            deceased_name, age, sex, place_of_death, hospital_name_if_applicable,
            bht_number, ward_number, date_of_death || null, time_of_death,
            immediate_cause, cause_due_to_1, cause_due_to_2, cause_due_to_3,
            contributory_causes, interval_between_onset_and_death,
            cause_under_investigation, specimens_retained, specimen_details,
            maternal_death, maternal_category, comments_opinions,
            conducting_jmo_name, designation, conducted_date || null, expected_report_completion_time,
            status
        ]);
    }

    await query(`
        INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
        VALUES ($1, 'SUBMIT_AUTOPSY_NOTIFICATION', 'autopsy_notification', $2, 'Submitted Health 1328 Autopsy Notification')
    `, [userId, result.rows[0].autopsy_notification_id]);

    return result.rows[0];
};

/**
 * Get MLR Cases for JMO with detailed status computation
 */
const getMlrCases = async (userId) => {
    let jmoId = null;
    try {
        const jmo = await getJmoDetails(userId);
        jmoId = jmo.jmo_id;
    } catch (e) {}

    let sql = `
        SELECT m.mlef_id, m.case_id, m.patient_id, m.request_date, m.reason, m.status AS mlef_status,
               pc.case_number, pc.case_type, pc.title AS case_title,
               ps.station_name,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name,
               e.examination_id, e.examination_date,
               (
                   SELECT COUNT(*)::int FROM laboratory_request lr 
                   JOIN specimen s ON lr.specimen_id = s.specimen_id
                   WHERE s.examination_id = e.examination_id
               ) AS total_lab_requests,
               (
                   SELECT COUNT(*)::int FROM laboratory_request lr 
                   JOIN specimen s ON lr.specimen_id = s.specimen_id
                   WHERE s.examination_id = e.examination_id AND lr.status = 'COMPLETED'
               ) AS completed_lab_requests,
               mlr.report_id, mlr.report_number, mlr.report_status,
               (SELECT COUNT(*)::int FROM mlef m2 WHERE m2.request_date <= m.request_date) AS seq_num
        FROM mlef m
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN police_station ps ON pc.station_id = ps.station_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        LEFT JOIN examination e ON m.mlef_id = e.mlef_id
        LEFT JOIN medico_legal_report mlr ON e.examination_id = mlr.examination_id
    `;
    const params = [];

    if (jmoId) {
        sql += ` WHERE e.jmo_id = $1 OR m.status IN ('ASSIGNED', 'COMPLETED')`;
        params.push(jmoId);
    }

    sql += ` ORDER BY m.request_date DESC`;

    const result = await query(sql, params);

    return result.rows.map(r => {
        let examStatus = r.examination_id ? (r.examination_date ? 'Examination Completed' : 'In Progress') : 'Pending Assignment';
        
        let labStatus = 'No Lab Requests';
        if (r.total_lab_requests > 0) {
            labStatus = r.total_lab_requests === r.completed_lab_requests 
                ? 'Laboratory Results Completed' 
                : 'Waiting for Laboratory Results';
        }

        let mlrStatus = 'Pending Examination';
        if (r.report_status === 'SIGNED') {
            mlrStatus = 'Signed';
        } else if (r.report_status === 'PENDING_SIGNATURE') {
            mlrStatus = 'Pending Signature';
        } else if (r.report_status === 'DRAFT') {
            mlrStatus = 'Draft MLR';
        } else if (r.examination_id) {
            mlrStatus = 'Ready for MLR';
        }

        return {
            ...r,
            formatted_mlef_id: `MLEF-${String(r.seq_num).padStart(6, '0')}`,
            exam_status_label: examStatus,
            lab_status_label: labStatus,
            mlr_status_label: mlrStatus
        };
    });
};

/**
 * Get aggregated Case Data for 14-section MLR Preparation
 */
const getMlrCaseData = async (userId, mlefId) => {
    // 1. Police & Patient Info
    const policeDetails = await getMlefPoliceDetails(userId, mlefId);

    // 2. JMO Profile Info for Declaration
    let jmoProfile = null;
    try {
        const jmoRes = await query(`
            SELECT jmo.jmo_id, jmo.registration_number, jmo.specialization,
                   p.first_name || ' ' || p.last_name AS jmo_name, p.telephone,
                   h.hospital_name
            FROM judicial_medical_officer jmo
            JOIN person p ON jmo.person_id = p.person_id
            JOIN hospital h ON jmo.hospital_id = h.hospital_id
            WHERE p.user_id = $1 LIMIT 1
        `, [userId]);
        if (jmoRes.rowCount > 0) jmoProfile = jmoRes.rows[0];
    } catch (e) {}

    // 3. Examination Details & Vital Signs
    const examRes = await query(`
        SELECT e.examination_id, e.examination_date, e.examination_notes, e.conclusion, e.created_at,
               vs.blood_pressure, vs.pulse_rate, vs.respiratory_rate, vs.temperature, vs.oxygen_saturation, vs.weight, vs.height
        FROM examination e
        LEFT JOIN vital_signs vs ON e.examination_id = vs.examination_id
        WHERE e.mlef_id = $1
    `, [mlefId]);

    const exam = examRes.rows[0] || null;

    // 4. Injuries Table
    let injuries = [];
    if (exam?.examination_id) {
        const injRes = await query(`
            SELECT injury_id, injury_type, body_location, size, severity, description, probable_weapon, estimated_age
            FROM injury
            WHERE examination_id = $1
            ORDER BY injury_id ASC
        `, [exam.examination_id]);
        injuries = injRes.rows;

        // Attach photos and body diagrams
        for (let inj of injuries) {
            const photos = await query(`SELECT injury_photo_id, image_path, description FROM injury_photo WHERE injury_id = $1`, [inj.injury_id]);
            const diagrams = await query(`SELECT diagram_id, diagram_image, annotation FROM body_diagram WHERE injury_id = $1`, [inj.injury_id]);
            inj.photos = photos.rows;
            inj.diagrams = diagrams.rows;
        }
    }

    // 5. Laboratory Investigations Results
    let labResults = [];
    if (exam?.examination_id) {
        const labRes = await query(`
            SELECT lr.result_id, lr.findings, lr.interpretation, lr.completed_date,
                   lt.test_name, lt.remarks,
                   l.laboratory_name,
                   tech_p.first_name || ' ' || tech_p.last_name AS technician_name
            FROM laboratory_result lr
            JOIN laboratory_test lt ON lr.test_id = lt.test_id
            JOIN laboratory_request req ON lt.request_id = req.request_id
            JOIN laboratory l ON req.laboratory_id = l.laboratory_id
            JOIN specimen s ON req.specimen_id = s.specimen_id
            LEFT JOIN laboratory_technician tech ON lt.technician_id = tech.technician_id
            LEFT JOIN person tech_p ON tech.person_id = tech_p.person_id
            WHERE s.examination_id = $1
            ORDER BY lr.completed_date DESC
        `, [exam.examination_id]);
        labResults = labRes.rows;
    }

    // 6. Existing Draft MLR (if any)
    let existingReport = null;
    if (exam?.examination_id) {
        const reportRes = await query(`
            SELECT report_id, report_number, findings, medical_opinion, recommendations, report_status, prepared_date
            FROM medico_legal_report
            WHERE examination_id = $1
        `, [exam.examination_id]);
        if (reportRes.rowCount > 0) existingReport = reportRes.rows[0];
    }

    return {
        officialInfo: {
            serialNumber: 'SL-MLR-' + String(policeDetails.seq_num).padStart(6, '0'),
            mlefNumber: policeDetails.formatted_mlef_id,
            magistrateCourt: 'Magistrate Court of Kandy',
            dateOfIssue: new Date().toISOString().slice(0, 10),
            caseNumber: policeDetails.case_number,
            policeStation: policeDetails.station_name,
            dateOfTrial: 'Pending Hearing'
        },
        policeDetails,
        jmoProfile,
        examination: exam,
        injuries,
        labResults,
        existingReport
    };
};

/**
 * Save MLR Report (Draft or Pending Signature)
 */
const saveMlrReport = async (userId, mlefId, reportData) => {
    const jmo = await getJmoDetails(userId);
    const {
        reportStatus = 'DRAFT',
        nonGrievousInjuries, grievousInjuries, fatalInjuries,
        penalCodeCategories, grievousRemarks,
        bluntWeaponInjuries, cutInjuries, sharpInjuries, stabInjuries, firearmInjuries, burnInjuries, biteInjuries,
        furtherNotices, historyCompatibility, selfInfliction, additionalRemarks,
        smellingLiquor, underInfluenceLiquor, otherIntoxicants,
        finalJmoOpinion,
        qualifications, designation, dispatchDate
    } = reportData;

    // Get examination_id
    const examRes = await query(`SELECT examination_id FROM examination WHERE mlef_id = $1`, [mlefId]);
    if (examRes.rowCount === 0) {
        throw new Error('Examination record not found for this MLEF.');
    }
    const examId = examRes.rows[0].examination_id;

    const findingsJSON = JSON.stringify({
        nonGrievousInjuries, grievousInjuries, fatalInjuries,
        penalCodeCategories, grievousRemarks,
        bluntWeaponInjuries, cutInjuries, sharpInjuries, stabInjuries, firearmInjuries, burnInjuries, biteInjuries,
        furtherNotices, historyCompatibility, selfInfliction, additionalRemarks,
        smellingLiquor, underInfluenceLiquor, otherIntoxicants,
        qualifications, designation, dispatchDate
    });

    const medicalOpinionText = `
[SECTION 7-12: JMO MEDICAL OPINION & CLASSIFICATION]
Non-grievous Injury Numbers: ${nonGrievousInjuries || 'None'}
Grievous Injury Numbers: ${grievousInjuries || 'None'}
Injuries Sufficient to Cause Death: ${fatalInjuries || 'None'}

Penal Code Sec. 311 Categories: ${Array.isArray(penalCodeCategories) ? penalCodeCategories.join(', ') : penalCodeCategories || 'N/A'}
Grievous Remarks: ${grievousRemarks || 'None'}

Causative Weapon Classification:
- Blunt: ${bluntWeaponInjuries || 'None'} | Cut: ${cutInjuries || 'None'} | Sharp: ${sharpInjuries || 'None'} | Stab: ${stabInjuries || 'None'}
- Firearm: ${firearmInjuries || 'None'} | Burns: ${burnInjuries || 'None'} | Bites: ${biteInjuries || 'None'}

Observations:
- History Compatibility: ${historyCompatibility || 'Yes'}
- Self-infliction Possibility: ${selfInfliction || 'No'}

Intoxication:
- Smelling Liquor: ${smellingLiquor || 'No'} | Under Influence: ${underInfluenceLiquor || 'No'} | Intoxicants: ${otherIntoxicants || 'None'}

FINAL JMO OPINION:
${finalJmoOpinion || 'N/A'}
    `.trim();

    return withTransaction(async (client) => {
        const reportNo = 'MLR-' + Date.now();

        const result = await client.query(`
            INSERT INTO medico_legal_report (examination_id, report_number, findings, medical_opinion, recommendations, report_status)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (examination_id)
            DO UPDATE SET findings = EXCLUDED.findings, medical_opinion = EXCLUDED.medical_opinion, 
                          recommendations = EXCLUDED.recommendations, report_status = EXCLUDED.report_status
            RETURNING report_id, report_number, report_status
        `, [examId, reportNo, findingsJSON, medicalOpinionText, finalJmoOpinion || 'None', reportStatus]);

        const report = result.rows[0];

        await client.query(`
            INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
            VALUES ($1, 'SAVE_MLR_REPORT', 'medico_legal_report', $2, 'Saved MLR Report with status ' || $3)
        `, [userId, report.report_id, reportStatus]);

        return report;
    });
};

/**
 * Apply Digital Signature to MLR
 */
const signMlrReport = async (userId, reportId, signatureData = {}) => {

    const result = await query(`
        UPDATE medico_legal_report
        SET report_status = 'SIGNED', prepared_date = CURRENT_TIMESTAMP
        WHERE report_id = $1
        RETURNING report_id, report_number, report_status, prepared_date
    `, [reportId]);

    if (result.rowCount === 0) {
        throw new Error('Report not found or failed to apply signature.');
    }

    await query(`
        INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
        VALUES ($1, 'SIGN_MLR_REPORT', 'medico_legal_report', $2, 'JMO digitally signed and finalized MLR Report')
    `, [userId, reportId]);

    return result.rows[0];
};

/**
 * Get Final Read-Only Signed MLR Report
 */
const getFinalMlrReport = async (userId, reportId) => {
    const result = await query(`
        SELECT mlr.report_id, mlr.report_number, mlr.findings, mlr.medical_opinion, mlr.recommendations, mlr.report_status, mlr.prepared_date,
               e.examination_id, e.examination_date, e.examination_notes, e.conclusion,
               m.mlef_id, m.request_date, m.reason AS mlef_reason,
               pc.case_number, pc.case_type, pc.title AS case_title,
               ps.station_name, ps.district AS station_district,
               off_p.first_name || ' ' || off_p.last_name AS requesting_officer_name, po.badge_number,
               pat_p.first_name || ' ' || pat_p.last_name AS patient_name, pat_p.nic, pat_p.gender, pat_p.date_of_birth, pat_p.address AS patient_address,
               jmo_p.first_name || ' ' || jmo_p.last_name AS jmo_name, jmo.registration_number AS jmo_reg_no, jmo.specialization AS jmo_specialization,
               h.hospital_name
        FROM medico_legal_report mlr
        JOIN examination e ON mlr.examination_id = e.examination_id
        JOIN mlef m ON e.mlef_id = m.mlef_id
        JOIN police_case pc ON m.case_id = pc.case_id
        JOIN police_station ps ON pc.station_id = ps.station_id
        JOIN police_officer po ON m.requesting_officer = po.officer_id
        JOIN person off_p ON po.person_id = off_p.person_id
        JOIN patient pat ON m.patient_id = pat.patient_id
        JOIN person pat_p ON pat.person_id = pat_p.person_id
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
        JOIN hospital h ON jmo.hospital_id = h.hospital_id
        WHERE mlr.report_id = $1
    `, [reportId]);

    if (result.rowCount === 0) {
        throw new Error('MLR report not found.');
    }

    const report = result.rows[0];
    let parsedFindings = {};
    try {
        parsedFindings = JSON.parse(report.findings);
    } catch (e) {
        parsedFindings = { raw: report.findings };
    }

    return {
        ...report,
        parsedFindings
    };
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
    getAutopsyCases,
    getAutopsyNotification,
    saveAutopsyNotification,
    getMlrCases,
    getMlrCaseData,
    saveMlrReport,
    signMlrReport,
    getFinalMlrReport,
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
