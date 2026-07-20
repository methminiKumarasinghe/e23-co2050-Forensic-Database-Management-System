CREATE TABLE autopsy (

    autopsy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    deceased_id UUID UNIQUE NOT NULL,

    jmo_id UUID NOT NULL,

    hospital_id UUID NOT NULL,

    autopsy_date TIMESTAMP NOT NULL,

    autopsy_type VARCHAR(100),

    external_findings TEXT,

    internal_findings TEXT,

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_autopsy_deceased
        FOREIGN KEY (deceased_id)
        REFERENCES deceased(deceased_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_autopsy_jmo
        FOREIGN KEY (jmo_id)
        REFERENCES judicial_medical_officer(jmo_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_autopsy_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital(hospital_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_autopsy_jmo ON autopsy(jmo_id);

CREATE TABLE cause_of_death (

    cause_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    autopsy_id UUID NOT NULL,

    cause_type VARCHAR(30)
        CHECK (cause_type IN ('PRIMARY','SECONDARY','CONTRIBUTING')),

    cause_description TEXT NOT NULL,

    icd10_code VARCHAR(20),

    manner_of_death VARCHAR(30)
        CHECK (manner_of_death IN
        ('Natural','Accident','Suicide','Homicide','Undetermined')),

    CONSTRAINT fk_cause_autopsy
        FOREIGN KEY (autopsy_id)
        REFERENCES autopsy(autopsy_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_cause_autopsy ON cause_of_death(autopsy_id);

CREATE TABLE document (

    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_number VARCHAR(50) UNIQUE NOT NULL,

    document_type VARCHAR(50),

    title VARCHAR(200),

    created_by UUID,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    version INTEGER DEFAULT 1,

    status VARCHAR(30)
        CHECK (status IN
        ('DRAFT','REVIEW','APPROVED','ARCHIVED')),

    CONSTRAINT fk_document_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_document_number
ON document(document_number);

CREATE TABLE autopsy_report (

    autopsy_report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    autopsy_id UUID UNIQUE NOT NULL,

    document_id UUID UNIQUE NOT NULL,

    summary TEXT,

    final_opinion TEXT,

    CONSTRAINT fk_report_autopsy
        FOREIGN KEY (autopsy_id)
        REFERENCES autopsy(autopsy_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_report_document
        FOREIGN KEY (document_id)
        REFERENCES document(document_id)
        ON DELETE CASCADE
);

ALTER TABLE medico_legal_report
ADD COLUMN document_id UUID UNIQUE;

ALTER TABLE medico_legal_report
ADD CONSTRAINT fk_medical_report_document
FOREIGN KEY (document_id)
REFERENCES document(document_id)
ON DELETE CASCADE;
