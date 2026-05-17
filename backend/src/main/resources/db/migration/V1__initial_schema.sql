CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    surname VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(255),
    department VARCHAR(255),
    birth_date VARCHAR(255),
    extra_info TEXT,
    linkedin VARCHAR(255),
    github VARCHAR(255),
    profile_image LONGTEXT,
    reset_code VARCHAR(255),
    reset_code_expire VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    github_url VARCHAR(500),
    status VARCHAR(255),
    start_date VARCHAR(255),
    end_date VARCHAR(255),
    created_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id BIGINT NOT NULL,
    member_emails VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(255),
    assigned_to TEXT,
    created_by VARCHAR(255),
    assignment_type VARCHAR(255),
    team_name VARCHAR(255),
    priority VARCHAR(255),
    due_date VARCHAR(255),
    project_id BIGINT,
    review_note TEXT,
    completed_by VARCHAR(255),
    approval_requested_at VARCHAR(255),
    approved_by VARCHAR(255),
    approved_at VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT,
    author_email VARCHAR(255),
    text TEXT,
    file_url LONGTEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(255),
    created_at VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender VARCHAR(255),
    receiver VARCHAR(255),
    text TEXT,
    timestamp VARCHAR(255),
    file_url LONGTEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255),
    description TEXT,
    status VARCHAR(255),
    created_by VARCHAR(255),
    receiver_email VARCHAR(255),
    project_id BIGINT,
    task_id BIGINT,
    requested_value TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receiver_email VARCHAR(255),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(255),
    task_id BIGINT,
    read_status BOOLEAN,
    created_at VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255),
    target_id BIGINT,
    action VARCHAR(255),
    actor_email VARCHAR(255),
    message TEXT,
    created_at VARCHAR(255)
);
