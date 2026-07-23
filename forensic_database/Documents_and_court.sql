CREATE TABLE uploaded_file (

    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    file_path TEXT NOT NULL,

    file_type VARCHAR(50),

    file_size BIGINT,

    uploaded_by UUID,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_uploaded_document
        FOREIGN KEY(document_id)
        REFERENCES document(document_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uploaded_user
        FOREIGN KEY(uploaded_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_uploaded_document
ON uploaded_file(document_id);

CREATE TABLE document_recipient (

    recipient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL,

    recipient_type VARCHAR(50),

    recipient_name VARCHAR(150),

    received_date TIMESTAMP,

    acknowledgement BOOLEAN DEFAULT FALSE,

    remarks TEXT,

    CONSTRAINT fk_recipient_document
        FOREIGN KEY(document_id)
        REFERENCES document(document_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_document_recipient
ON document_recipient(document_id);

CREATE TABLE court (

    court_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    court_name VARCHAR(150) NOT NULL,

    court_type VARCHAR(100),

    address TEXT,

    district VARCHAR(100),

    telephone VARCHAR(20),

    email CITEXT
);

CREATE TABLE court_case (

    court_case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id UUID NOT NULL,

    court_id UUID NOT NULL,

    case_number VARCHAR(50) UNIQUE NOT NULL,

    judge_name VARCHAR(150),

    prosecutor_name VARCHAR(150),

    status VARCHAR(30)
        CHECK(status IN
        ('OPEN','ONGOING','CLOSED')),

    filing_date DATE,

    CONSTRAINT fk_court_case
        FOREIGN KEY(case_id)
        REFERENCES police_case(case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_court
        FOREIGN KEY(court_id)
        REFERENCES court(court_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_court_case
ON court_case(case_id);
