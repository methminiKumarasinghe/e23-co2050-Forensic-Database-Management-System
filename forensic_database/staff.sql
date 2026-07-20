CREATE TABLE police_officer (

    officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    station_id UUID NOT NULL,

    badge_number VARCHAR(50) UNIQUE,

    rank VARCHAR(50),

    joined_date DATE,

    CONSTRAINT fk_police_person
        FOREIGN KEY (person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_police_station
        FOREIGN KEY (station_id)
        REFERENCES police_station(station_id)
        ON DELETE RESTRICT
);

CREATE TABLE judicial_medical_officer (

    jmo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    hospital_id UUID NOT NULL,

    registration_number VARCHAR(50) UNIQUE,

    specialization VARCHAR(100),

    joined_date DATE,

    CONSTRAINT fk_jmo_person
        FOREIGN KEY (person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_jmo_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital(hospital_id)
        ON DELETE RESTRICT
);


CREATE TABLE medical_officer (

    medical_officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    hospital_id UUID NOT NULL,

    registration_number VARCHAR(50) UNIQUE,

    joined_date DATE,

    CONSTRAINT fk_medical_person
        FOREIGN KEY (person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_medical_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital(hospital_id)
        ON DELETE RESTRICT
);

CREATE TABLE laboratory_technician (

    technician_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    hospital_id UUID NOT NULL,

    employee_number VARCHAR(50) UNIQUE,

    qualification VARCHAR(100),

    joined_date DATE,

    CONSTRAINT fk_lab_person
        FOREIGN KEY (person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lab_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital(hospital_id)
        ON DELETE RESTRICT
);

CREATE TABLE government_analyst (

    analyst_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID UNIQUE NOT NULL,

    organization_name VARCHAR(150),

    employee_number VARCHAR(50) UNIQUE,

    designation VARCHAR(100),

    CONSTRAINT fk_analyst_person
        FOREIGN KEY (person_id)
        REFERENCES person(person_id)
        ON DELETE CASCADE
);

CREATE TABLE forensic_staff (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID UNIQUE NOT NULL,
    hospital_id UUID NOT NULL,
    employee_number VARCHAR(50) UNIQUE,
    joined_date DATE,
    CONSTRAINT fk_fstaff_person FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_fstaff_hospital FOREIGN KEY (hospital_id) REFERENCES hospital(hospital_id) ON DELETE RESTRICT
);