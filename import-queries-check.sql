-- How many users were imported?
SELECT COUNT(*) AS total_users_imported
FROM users;

-- Quick sample of users (first 10)
SELECT 
    id,
    username,
    role,
    recipient_id,
    created_at::date AS created
FROM users
ORDER BY username
LIMIT 10;

SELECT 
    u.username,
    u.role,
    r.recipient_name AS department,
    r.recipient_code AS dept_code,
    r.initial AS dept_initial,
    u.recipient_id AS user_recipient_id,
    r.id AS recipient_id_from_table,
    u.created_at::date AS user_created
FROM users u
LEFT JOIN recipients r ON u.recipient_id = r.id
ORDER BY u.username;

SELECT 
    u.username,
    u.role,
    u.recipient_id,
    'MISSING LINK' AS issue
FROM users u
LEFT JOIN recipients r ON u.recipient_id = r.id
WHERE r.id IS NULL
ORDER BY u.username;

SELECT 
    role,
    COUNT(*) AS count,
    STRING_AGG(username, ', ') AS users_in_role
FROM users
GROUP BY role
ORDER BY count DESC;

SELECT 
    u.username || ' → ' || COALESCE(r.recipient_name, 'NO DEPARTMENT') AS user_and_dept
FROM users u
LEFT JOIN recipients r ON u.recipient_id = r.id
ORDER BY u.username;
