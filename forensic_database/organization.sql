CREATE TABLE person (

    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    nic VARCHAR(20) UNIQUE,

    gender VARCHAR(10)
        CHECK (gender IN ('Male','Female','Other')),

    date_of_birth DATE,

    telephone VARCHAR(20),

    email CITEXT,

    address TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_person_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


CREATE TABLE hospital (

    hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hospital_name VARCHAR(150) NOT NULL,

    hospital_type VARCHAR(50),

    address TEXT,

    district VARCHAR(100),

    telephone VARCHAR(20),

    email CITEXT
);

CREATE TABLE department (

    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hospital_id UUID NOT NULL,

    department_name VARCHAR(100) NOT NULL,

    description TEXT,

    CONSTRAINT fk_department_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital(hospital_id)
        ON DELETE CASCADE
);

CREATE TABLE police_station (

    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    station_name VARCHAR(150) NOT NULL,

    district VARCHAR(100),

    address TEXT,

    telephone VARCHAR(20),

    email CITEXT
);

