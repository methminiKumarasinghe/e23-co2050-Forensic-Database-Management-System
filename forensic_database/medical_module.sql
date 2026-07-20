CREATE TABLE patient (

    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    blood_group VARCHAR(5),

    medical_record_number VARCHAR(50) UNIQUE,

    emergency_contact VARCHAR(100),

    emergency_phone VARCHAR(20),

    CONSTRAINT fk_patient_person
        FOREIGN KEY(person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE
);

CREATE TABLE deceased (

    deceased_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    date_of_death DATE,

    place_of_death TEXT,

    identified BOOLEAN DEFAULT TRUE,

    identification_notes TEXT,

    CONSTRAINT fk_deceased_person
        FOREIGN KEY(person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE
);

CREATE TABLE mlef (

    mlef_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID NOT NULL,

    patient_id UUID NOT NULL,

    requesting_officer UUID NOT NULL,

    hospital_id UUID NOT NULL,

    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    reason TEXT,

    status VARCHAR(30)
        DEFAULT 'PENDING',

    CONSTRAINT fk_mlef_case
        FOREIGN KEY(case_id)
        REFERENCES police_case(case_id),

    CONSTRAINT fk_mlef_patient
        FOREIGN KEY(patient_id)
        REFERENCES patient(patient_id),

    CONSTRAINT fk_mlef_officer
        FOREIGN KEY(requesting_officer)
        REFERENCES police_officer(officer_id),

    CONSTRAINT fk_mlef_hospital
        FOREIGN KEY(hospital_id)
        REFERENCES hospital(hospital_id)
);

CREATE TABLE examination_status (

    status_id SERIAL PRIMARY KEY,

    status_name VARCHAR(50) UNIQUE,

    description TEXT
);

INSERT INTO examination_status(status_name)
VALUES
('PENDING'),
('IN_PROGRESS'),
('COMPLETED'),
('REVIEWED');

CREATE TABLE examination (

    examination_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mlef_id UUID UNIQUE NOT NULL,

    jmo_id UUID NOT NULL,

    status_id INT NOT NULL,

    examination_date TIMESTAMP,

    examination_notes TEXT,
    
    category_of_hurt VARCHAR(100),
    
    history_given_by_patient TEXT,
    
    general_exam_notes TEXT,
    
    smell_of_liquor BOOLEAN,
    
    intoxicated BOOLEAN,
    
    alcohol_exam_notes TEXT,
    
    vaginal_penetration BOOLEAN,
    
    anal_penetration BOOLEAN,
    
    inter_labial_penetration BOOLEAN,
    
    sexual_assault_notes TEXT,

    conclusion TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_mlef
        FOREIGN KEY(mlef_id)
        REFERENCES mlef(mlef_id),

    CONSTRAINT fk_exam_jmo
        FOREIGN KEY(jmo_id)
        REFERENCES judicial_medical_officer(jmo_id),

    CONSTRAINT fk_exam_status
        FOREIGN KEY(status_id)
        REFERENCES examination_status(status_id)
);

CREATE TABLE vital_signs (

    vital_sign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    examination_id UUID UNIQUE NOT NULL,

    blood_pressure VARCHAR(20),

    pulse_rate INT,

    respiratory_rate INT,

    temperature NUMERIC(4,1),

    oxygen_saturation NUMERIC(5,2),

    weight NUMERIC(5,2),

    height NUMERIC(5,2),

    CONSTRAINT fk_vital_exam
        FOREIGN KEY(examination_id)
        REFERENCES examination(examination_id)
        ON DELETE CASCADE
);

CREATE TABLE injury (

    injury_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    examination_id UUID NOT NULL,

    injury_type VARCHAR(100),

    body_location VARCHAR(100),

    size VARCHAR(100),

    severity VARCHAR(50),

    description TEXT,

    probable_weapon VARCHAR(100),

    estimated_age VARCHAR(100),

    CONSTRAINT fk_injury_exam
        FOREIGN KEY(examination_id)
        REFERENCES examination(examination_id)
        ON DELETE CASCADE
);

CREATE TABLE injury_photo (

    injury_photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    injury_id UUID NOT NULL,

    image_path TEXT,

    captured_date TIMESTAMP,

    description TEXT,

    CONSTRAINT fk_photo_injury
        FOREIGN KEY(injury_id)
        REFERENCES injury(injury_id)
        ON DELETE CASCADE
);

CREATE TABLE body_diagram (

    diagram_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    injury_id UUID NOT NULL,

    diagram_image TEXT,

    annotation TEXT,

    CONSTRAINT fk_diagram_injury
        FOREIGN KEY(injury_id)
        REFERENCES injury(injury_id)
        ON DELETE CASCADE
);

CREATE TABLE specimen (

    specimen_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    examination_id UUID NOT NULL,

    specimen_type VARCHAR(100),

    collection_datetime TIMESTAMP,

    collected_by UUID,

    remarks TEXT,

    CONSTRAINT fk_specimen_exam
        FOREIGN KEY(examination_id)
        REFERENCES examination(examination_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_specimen_jmo
        FOREIGN KEY(collected_by)
        REFERENCES judicial_medical_officer(jmo_id)
);

CREATE TABLE medico_legal_report (

    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    examination_id UUID UNIQUE NOT NULL,

    report_number VARCHAR(50) UNIQUE,

    findings TEXT,

    medical_opinion TEXT,

    recommendations TEXT,

    report_status VARCHAR(30) DEFAULT 'DRAFT',

    prepared_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_exam
        FOREIGN KEY(examination_id)
        REFERENCES examination(examination_id)
        ON DELETE CASCADE
);

CREATE TABLE appointment (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jmo_id UUID NOT NULL REFERENCES judicial_medical_officer(jmo_id),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    mlef_id UUID REFERENCES mlef(mlef_id),
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'SCHEDULED',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE specimen ADD COLUMN storage_condition VARCHAR(100);
ALTER TABLE specimen ADD COLUMN current_status VARCHAR(50);