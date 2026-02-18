-- Seed Fake Profile for User f38727de-5557-4c94-8382-5200c032d45a

DO $$
DECLARE
    target_user_id UUID := 'f38727de-5557-4c94-8382-5200c032d45a';
    v_dept_id INTEGER;
    v_pos_id INTEGER;
BEGIN
    -- 1. Ensure at least one department exists
    INSERT INTO departments (department_name, department_code)
    VALUES ('Engineering', 'ENG')
    ON CONFLICT DO NOTHING;
    
    SELECT department_id INTO v_dept_id FROM departments WHERE department_code = 'ENG' LIMIT 1;

    -- 2. Ensure at least one position exists
    INSERT INTO positions (position_name, department_id)
    VALUES ('Software Engineer', v_dept_id)
    ON CONFLICT DO NOTHING;

    SELECT position_id INTO v_pos_id FROM positions WHERE position_name = 'Software Engineer' LIMIT 1;

    -- 3. Upsert Employee Profile
    -- We use ON CONFLICT (user_id) if there's a unique constraint, but schema doesn't explicitly show one on user_id alone in the snippets.
    -- However, let's try to update if exists or insert if not.
    -- Since we don't have a guaranteed unique constraint on user_id visible in snippets (it might be there), we'll do a check first.
    
    IF EXISTS (SELECT 1 FROM employees WHERE user_id = target_user_id) THEN
        UPDATE employees
        SET 
            first_name = 'John',
            last_name = 'Doe',
            employee_code = 'EMP-001',
            email = 'john.doe@example.com',
            role = 'admin', -- Making them admin for easier testing
            dept_id = v_dept_id,
            pos_id = v_pos_id,
            is_active = true
        WHERE user_id = target_user_id;
    ELSE
        INSERT INTO employees (
            user_id, 
            employee_code, 
            first_name, 
            last_name, 
            email, 
            role, 
            dept_id, 
            pos_id,
            is_active,
            join_date
        ) VALUES (
            target_user_id,
            'EMP-001',
            'John',
            'Doe',
            'john.doe@example.com',
            'admin',
            v_dept_id,
            v_pos_id,
            true,
            CURRENT_DATE
        );
    END IF;

END $$;
