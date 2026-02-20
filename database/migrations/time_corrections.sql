-- Migration: Create time_correction_requests table

CREATE TABLE IF NOT EXISTS public.time_correction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    hr_comment TEXT,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_correction_user_id ON public.time_correction_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_correction_status ON public.time_correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_correction_date ON public.time_correction_requests(date);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_correction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_time_correction_updated_at ON public.time_correction_requests;
CREATE TRIGGER trg_time_correction_updated_at
BEFORE UPDATE ON public.time_correction_requests
FOR EACH ROW EXECUTE FUNCTION update_time_correction_updated_at();

-- Add RLS Policies
ALTER TABLE public.time_correction_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Employees can view their own requests
CREATE POLICY "Users can view their own time correction requests"
ON public.time_correction_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Employees can insert their own requests
CREATE POLICY "Users can insert their own time correction requests"
ON public.time_correction_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: HR/Admin can view all requests
CREATE POLICY "HR and Admin can view all time correction requests"
ON public.time_correction_requests
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.user_id = auth.uid()
        AND employees.role IN ('admin', 'hr', 'manager')
    )
);

-- Policy 4: HR/Admin can update all requests
CREATE POLICY "HR and Admin can update all time correction requests"
ON public.time_correction_requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.user_id = auth.uid()
        AND employees.role IN ('admin', 'hr', 'manager')
    )
);
