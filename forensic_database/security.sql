CREATE TABLE users (

    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(50) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    email CITEXT UNIQUE,

    phone VARCHAR(20),

    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK(status IN ('ACTIVE','INACTIVE','SUSPENDED')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    last_login TIMESTAMP

);

CREATE TABLE roles (

    role_id SERIAL PRIMARY KEY,

    role_name VARCHAR(50) UNIQUE NOT NULL,

    description TEXT

);

INSERT INTO roles(role_name,description)
VALUES

('ADMIN',
'System administrator'),

('POLICE',
'Police officer'),

('JMO',
'Judicial Medical Officer'),

('MEDICAL_OFFICER',
'Medical officer'),

('LAB_TECHNICIAN',
'Laboratory technician'),

('GOVERNMENT_ANALYST',
'Government analyst'),

('FORENSIC_STAFF',
'Forensic Staff');

CREATE TABLE permissions (

    permission_id SERIAL PRIMARY KEY,

    permission_name VARCHAR(100)
        UNIQUE NOT NULL,

    description TEXT

);


INSERT INTO permissions(permission_name)
VALUES

('CREATE_CASE'),

('VIEW_CASE'),

('UPDATE_CASE'),

('ADD_EVIDENCE'),

('VIEW_EVIDENCE'),

('CREATE_EXAMINATION'),

('UPDATE_EXAMINATION'),

('CREATE_MEDICAL_REPORT'),

('VIEW_MEDICAL_REPORT'),

('REQUEST_LAB_TEST'),

('UPLOAD_LAB_RESULT'),

('MANAGE_USERS');


CREATE TABLE user_roles (

    user_role_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    role_id INT NOT NULL,

    assigned_date DATE
        DEFAULT CURRENT_DATE,


    CONSTRAINT fk_user_role_user

    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

    ON DELETE CASCADE,


    CONSTRAINT fk_user_role_role

    FOREIGN KEY(role_id)

    REFERENCES roles(role_id)

    ON DELETE CASCADE

);

CREATE TABLE role_permissions (

    role_permission_id SERIAL PRIMARY KEY,

    role_id INT NOT NULL,

    permission_id INT NOT NULL,


    FOREIGN KEY(role_id)

    REFERENCES roles(role_id)

    ON DELETE CASCADE,


    FOREIGN KEY(permission_id)

    REFERENCES permissions(permission_id)

    ON DELETE CASCADE,


    UNIQUE(role_id, permission_id)

);

CREATE TABLE notifications (

    notification_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    message TEXT NOT NULL,

    notification_type VARCHAR(50),

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

    ON DELETE CASCADE

);

CREATE TABLE audit_logs (

    audit_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID,

    action VARCHAR(100),

    entity_name VARCHAR(100),

    entity_id UUID,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

);

CREATE TABLE digital_signatures (

    signature_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    document_id UUID,

    signature_hash TEXT NOT NULL,

    signed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

);

SELECT table_name
FROM information_schema.tables
WHERE table_schema='public';