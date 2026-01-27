-- Create Leaves Table
-- This table stores employee leave requests

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by VARCHAR(50),
  approved_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Foreign key constraint (assuming employees table exists)
  CONSTRAINT fk_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id)
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leaves_created_at ON leaves(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_leaves_updated_at ON leaves;
CREATE TRIGGER update_leaves_updated_at
    BEFORE UPDATE ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- Uncomment the following lines if you want sample data

/*
INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days, reason, status) VALUES
('EMP001', 'annual', '2026-02-01', '2026-02-05', 5, 'Family vacation', 'approved'),
('EMP002', 'sick', '2026-01-27', '2026-01-28', 2, 'Medical appointment', 'pending'),
('EMP001', 'personal', '2026-03-10', '2026-03-10', 1, 'Personal matters', 'pending');
*/

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment and adjust as needed)
/*
CREATE POLICY "Users can view their own leaves"
  ON leaves FOR SELECT
  USING (auth.uid()::text = employee_id);

CREATE POLICY "Users can insert their own leaves"
  ON leaves FOR INSERT
  WITH CHECK (auth.uid()::text = employee_id);

CREATE POLICY "Users can update their own pending leaves"
  ON leaves FOR UPDATE
  USING (auth.uid()::text = employee_id AND status = 'pending')
  WITH CHECK (auth.uid()::text = employee_id);

CREATE POLICY "Managers can view all leaves"
  ON leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employee_id = auth.uid()::text
      AND role = 'manager'
    )
  );

CREATE POLICY "Managers can approve/reject leaves"
  ON leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employee_id = auth.uid()::text
      AND role = 'manager'
    )
  );
*/
