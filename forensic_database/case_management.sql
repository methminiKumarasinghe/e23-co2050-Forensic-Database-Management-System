CREATE TABLE case_status (

    status_id SERIAL PRIMARY KEY,

    status_name VARCHAR(50) UNIQUE NOT NULL,

    description TEXT
);

INSERT INTO case_status(status_name,description)
VALUES
('OPEN','Case has been registered'),
('UNDER_INVESTIGATION','Investigation is ongoing'),
('AWAITING_EXAMINATION','Waiting for medico-legal examination'),
('IN_COURT','Court proceedings have started'),
('CLOSED','Case is completed');

CREATE TABLE police_case (

    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    station_id UUID NOT NULL,

    status_id INT NOT NULL,

    case_number VARCHAR(50) UNIQUE NOT NULL,

    case_type VARCHAR(100),

    title VARCHAR(200),

    description TEXT,

    date_reported TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_case_station
        FOREIGN KEY(station_id)
        REFERENCES police_station(station_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_case_status
        FOREIGN KEY(status_id)
        REFERENCES case_status(status_id)
);

CREATE TABLE case_assignment (

    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID NOT NULL,

    officer_id UUID NOT NULL,

    assignment_role VARCHAR(50),

    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    removed_date TIMESTAMP,

    CONSTRAINT fk_assignment_case
        FOREIGN KEY(case_id)
        REFERENCES police_case(case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_officer
        FOREIGN KEY(officer_id)
        REFERENCES police_officer(officer_id)
        ON DELETE RESTRICT
);


CREATE TABLE incident (

    incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID NOT NULL,

    incident_datetime TIMESTAMP,

    location TEXT,

    description TEXT,

    weather VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_case
        FOREIGN KEY(case_id)
        REFERENCES police_case(case_id)
        ON DELETE CASCADE
);

CREATE TABLE evidence (

    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID NOT NULL,

    evidence_type VARCHAR(100),

    description TEXT,

    collected_by UUID,

    collected_date TIMESTAMP,

    current_status VARCHAR(50),

    CONSTRAINT fk_evidence_case
        FOREIGN KEY(case_id)
        REFERENCES police_case(case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_evidence_officer
        FOREIGN KEY(collected_by)
        REFERENCES police_officer(officer_id)
        ON DELETE SET NULL
);

CREATE TABLE evidence_photo (

    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evidence_id UUID NOT NULL,

    file_path TEXT NOT NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    uploaded_by UUID,

    description TEXT,

    CONSTRAINT fk_photo_evidence
        FOREIGN KEY(evidence_id)
        REFERENCES evidence(evidence_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_photo_user
        FOREIGN KEY(uploaded_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE evidence_storage (

    storage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    storage_name VARCHAR(100),

    location TEXT,

    storage_type VARCHAR(50),

    capacity INTEGER,

    remarks TEXT
);

CREATE TABLE chain_of_custody (

    custody_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evidence_id UUID NOT NULL,

    transfer_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_custody_evidence
        FOREIGN KEY(evidence_id)
        REFERENCES evidence(evidence_id)
        ON DELETE CASCADE
);

CREATE TABLE evidence_transfer (

    transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    custody_id UUID NOT NULL,

    from_user UUID,

    to_user UUID,

    storage_id UUID,

    transfer_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    remarks TEXT,

    CONSTRAINT fk_transfer_custody
        FOREIGN KEY(custody_id)
        REFERENCES chain_of_custody(custody_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_storage
        FOREIGN KEY(storage_id)
        REFERENCES evidence_storage(storage_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_transfer_from
        FOREIGN KEY(from_user)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_transfer_to
        FOREIGN KEY(to_user)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE case_activity (

    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID NOT NULL,

    user_id UUID,

    activity_type VARCHAR(100),

    description TEXT,

    activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_case
        FOREIGN KEY(case_id)
        REFERENCES police_case(case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_activity_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);