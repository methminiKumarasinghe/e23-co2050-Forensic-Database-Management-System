CREATE TABLE laboratory (

    laboratory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hospital_id UUID NOT NULL,

    laboratory_name VARCHAR(150),

    laboratory_type VARCHAR(100),

    contact_number VARCHAR(20),

    email CITEXT,

    CONSTRAINT fk_lab_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital(hospital_id)
        ON DELETE CASCADE
);

CREATE TABLE laboratory_request (

    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    specimen_id UUID NOT NULL,

    laboratory_id UUID NOT NULL,

    requested_by UUID NOT NULL,

    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    priority VARCHAR(20),

    status VARCHAR(30) DEFAULT 'PENDING',

    CONSTRAINT fk_request_specimen
        FOREIGN KEY(specimen_id)
        REFERENCES specimen(specimen_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_request_lab
        FOREIGN KEY(laboratory_id)
        REFERENCES laboratory(laboratory_id),

    CONSTRAINT fk_request_jmo
        FOREIGN KEY(requested_by)
        REFERENCES judicial_medical_officer(jmo_id)
);

CREATE TABLE laboratory_test (

    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID NOT NULL,

    technician_id UUID,

    test_name VARCHAR(150),

    started_at TIMESTAMP,

    completed_at TIMESTAMP,

    status VARCHAR(30) DEFAULT 'PENDING',

    remarks TEXT,

    CONSTRAINT fk_test_request
        FOREIGN KEY(request_id)
        REFERENCES laboratory_request(request_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_test_technician
        FOREIGN KEY(technician_id)
        REFERENCES laboratory_technician(technician_id)
);

CREATE TABLE laboratory_result (

    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    test_id UUID UNIQUE NOT NULL,

    findings TEXT,

    interpretation TEXT,

    report_file TEXT,

    completed_date TIMESTAMP,

    CONSTRAINT fk_result_test
        FOREIGN KEY(test_id)
        REFERENCES laboratory_test(test_id)
        ON DELETE CASCADE
);

ALTER TABLE laboratory_request ADD COLUMN accepted_date TIMESTAMP;
ALTER TABLE laboratory_request ADD COLUMN accepted_by UUID REFERENCES laboratory_technician(technician_id);

ALTER TABLE laboratory_test ADD COLUMN test_category VARCHAR(100);
ALTER TABLE laboratory_test ADD COLUMN expected_completion_date DATE;

CREATE TABLE laboratory_attachment (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES laboratory_result(result_id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
